import fuzzysort from "fuzzysort";
import { type App, type TFile } from "obsidian";
import { type AtSymbolLinkingSettings } from "src/settings/settings";
import { type fileOption } from "src/types";
import { removeAccents } from "src/utils/remove-accents";

export function sharedGetSuggestions(
	app: App,
	files: TFile[],
	query: string,
	settings: AtSymbolLinkingSettings,
	specificFolders?: string[],
	triggeredSymbol?: string,
	isNewNoteOnlySymbol?: boolean
): Fuzzysort.KeysResult<fileOption>[] {
	// If this is a new-note-only symbol, skip file searching and only show create option
	if (isNewNoteOnlySymbol && settings.showAddNewNote) {
		const results: Fuzzysort.KeysResult<fileOption>[] = [];
		const folderMapping = settings.addNewNoteFolders.find(
			(mapping) => mapping.symbol === triggeredSymbol
		);
		if (folderMapping) {
			const folder = folderMapping.folder || "";
			const template = folderMapping.template || "";
			const separator = folder ? "/" : "";

			// Always show "Create new note" option, even with empty query
			// When no query, show folder path with a placeholder; when query exists, show full path
			const symbolPrefix =
				settings.includeSymbolInNewFileName && triggeredSymbol
					? triggeredSymbol
					: "";
			const displayPath = query
				? `${folder.trim()}${separator}${symbolPrefix}${query.trim()}.md`
				: folder
				? `${folder}/...`
				: "...";

			results.push({
				obj: {
					isCreateNewOption: true,
					query: query || "",
					fileName: "Create new note",
					filePath: displayPath,
					newNoteTemplate: template,
				},
			} as Fuzzysort.KeysResult<fileOption>);
		}
		return results;
	}

	const options: fileOption[] = [];
	for (const file of files) {
		// If specific folders are provided, only include files from those folders
		if (specificFolders && specificFolders.length > 0) {
			let isInSpecificFolder = false;
			for (const folder of specificFolders) {
				if (file.path.startsWith(folder)) {
					isInSpecificFolder = true;
					break;
				}
			}
			if (!isInSpecificFolder) {
				continue;
			}
		}
		// If specificFolders is explicitly undefined (not passed), no folder filtering is applied
		// This means the trigger symbol has no folder restrictions
		const meta = app.metadataCache.getFileCache(file);
		if (meta?.frontmatter?.alias) {
			options.push({
				fileName: settings.removeAccents
					? removeAccents(file.basename)
					: file.basename,
				filePath: file.path,
				alias: meta.frontmatter.alias,
			});
		} else if (meta?.frontmatter?.aliases) {
			let aliases = meta.frontmatter.aliases;
			if (typeof meta.frontmatter.aliases === "string") {
				aliases = meta.frontmatter.aliases
					.split(",")
					.map((s) => s.trim());
			}
			for (const alias of aliases) {
				options.push({
					fileName: settings.removeAccents
						? removeAccents(file.basename)
						: file.basename,
					filePath: file.path,
					alias: settings.removeAccents
						? removeAccents(alias)
						: alias,
				});
			}
		}
		// Include fileName without alias as well
		options.push({
			fileName: settings.removeAccents
				? removeAccents(file.basename)
				: file.basename,
			filePath: file.path,
		});
	}

	// Show all files when no query
	let results = [];
	if (!query) {
		results = options
			.map((option) => ({
				obj: option,
			}))
			// Reverse because filesystem is sorted alphabetically
			.reverse();
	} else {
		// Fuzzy search files based on query
		results = fuzzysort.go(query, options, {
			keys: ["alias", "fileName"],
		}) as any;
	}

	// If showAddNewNote option is enabled, show it as the last option
	if (settings.showAddNewNote && query) {
		// Don't show if it has the same filename as an existing note
		const hasExistingNote = results.some(
			(result: Fuzzysort.KeysResult<fileOption>) =>
				result?.obj?.fileName.toLocaleLowerCase() ===
				query?.toLocaleLowerCase()
		);
		if (!hasExistingNote) {
			results = results.filter(
				(result: Fuzzysort.KeysResult<fileOption>) =>
					!result.obj?.isCreateNewOption
			);

			// Find the appropriate folder/template based on triggered symbol
			let folder = settings.addNewNoteDirectory || "";
			let template = settings.addNewNoteTemplateFile || "";

			if (triggeredSymbol && settings.addNewNoteFolders.length > 0) {
				const folderMapping = settings.addNewNoteFolders.find(
					(mapping) => mapping.symbol === triggeredSymbol
				);
				if (folderMapping) {
					folder = folderMapping.folder || "";
					template = folderMapping.template || "";
				}
			}

			const separator = folder ? "/" : "";
			const symbolPrefix =
				settings.includeSymbolInNewFileName && triggeredSymbol
					? triggeredSymbol
					: "";
			results.push({
				obj: {
					isCreateNewOption: true,
					query: query,
					fileName: "Create new note",
					filePath: `${folder.trim()}${separator}${symbolPrefix}${query.trim()}.md`,
					newNoteTemplate: template,
				},
			});
		}
	}

	return results;
}
