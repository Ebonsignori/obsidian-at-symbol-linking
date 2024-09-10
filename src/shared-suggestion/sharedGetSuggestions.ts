import fuzzysort from "fuzzysort";
import { type App, TFile, normalizePath } from "obsidian";
import type { FileOption } from "src/types";
import type { CustomSuggester } from "../settings/interface";

export function sharedGetSuggestions(
	files: TFile[],
	query: string,
	settings: CustomSuggester,
	app: App,
	typedChar: string,
): Fuzzysort.KeysResult<FileOption>[] {
	const options: FileOption[] = [];
	const newFolderOfcreation = normalizePath(`${settings.addNewNoteDirectory.trim()}/`);
	const allNewFolder: Set<string> = new Set();
	if (settings.addNewNoteDirectory.trim().length > 0)
		allNewFolder.add(newFolderOfcreation);
	for (const file of files) {
		// If there are folders to limit links to, check if the file is in one of them
		if (settings.limitToDirectories.length > 0) {
			let isAllowed = false;
			for (const folder of settings.limitToDirectories) {
				if (typedChar !== folder.triggerSymbol) continue;
				if (file.parent?.path.startsWith(folder.path)) {
					isAllowed = true;
					allNewFolder.add(folder.path);
					break;
				}
			}
			if (!isAllowed) {
				continue;
			}
		}
		const meta = app.metadataCache.getFileCache(file);
		const fileName = settings.removeAccents
			? file.basename.removeAccents()
			: file.basename;
		if (meta?.frontmatter?.alias) {
			options.push({
				fileName,
				filePath: file.path,
				alias: meta.frontmatter.alias,
			});
		} else if (meta?.frontmatter?.aliases) {
			let aliases = meta.frontmatter.aliases;
			if (typeof meta.frontmatter.aliases === "string") {
				aliases = meta.frontmatter.aliases.split(",").map((s) => s.trim());
			}
			for (const alias of aliases) {
				options.push({
					fileName,
					filePath: file.path,
					alias: settings.removeAccents ? alias.removeAccents() : alias,
				});
			}
		}
		// Include fileName without alias as well
		options.push({
			fileName,
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
		console.log(newFolderOfcreation);
		// Don't show if it has the same filename as an existing note
		const hasExistingNote = results.some(
			(result: Fuzzysort.KeysResult<FileOption>) =>
				result?.obj?.fileName.toLocaleLowerCase() === query?.toLocaleLowerCase(),
		);
		if (!hasExistingNote) {
			results = results.filter(
				(result: Fuzzysort.KeysResult<FileOption>) => !result.obj?.isCreateNewOption,
			);
			for (const folder of allNewFolder) {
				results.push({
					obj: {
						isCreateNewOption: true,
						query,
						fileName: query,
						filePath: normalizePath(`${folder}/${query.trim()}.md`),
					},
				});
			}
		}
	}

	return results;
}

export function sharedGetMonoFileSuggestion(
	query: string,
	settings: CustomSuggester,
	app: App,
	typedChar: string,
): Fuzzysort.KeysResult<FileOption>[] {
	if (settings.limitToFile.length === 0) return [];
	const files: TFile[] = settings.limitToFile
		.filter((x) => x.triggerSymbol == typedChar)
		.map((path) => {
			const file = app.vault.getAbstractFileByPath(path.path);
			if (file && file instanceof TFile) return file;
			return null;
		})
		.filter((file) => file !== null) as TFile[];
	if (files.length === 0) return [];
	const options: FileOption[] = [];
	for (const file of files) {
		const meta = app.metadataCache.getFileCache(file);
		if (!meta || !meta.headings) return [];

		const heading =
			settings.headerLevelForContact === 0
				? meta.headings
				: meta.headings.filter(
						(heading) => heading.level === settings.headerLevelForContact,
					);
		const option: FileOption[] = heading.map((heading) => ({
			fileName: heading.heading,
			filePath: file.path,
		}));
		options.push(...option);
	}
	if (options.length === 0) return [];

	let results = [];
	if (!query) {
		results = options.map((option) => ({
			obj: option,
		}));
	} else {
		results = fuzzysort.go(query, options, {
			keys: ["fileName"],
		}) as any;
	}
	if (settings.appendAsHeader && query) {
		const hasExistingHeader = results.some(
			(result: Fuzzysort.KeysResult<FileOption>) =>
				result?.obj?.fileName.toLocaleLowerCase() === query?.toLocaleLowerCase(),
		);
		if (!hasExistingHeader) {
			results = results.filter(
				(result: Fuzzysort.KeysResult<FileOption>) => !result.obj?.isCreateNewOption,
			);
			for (const file of files) {
				results.push({
					obj: {
						isCreateNewOption: true,
						query,
						fileName: query,
						filePath: file.path,
					},
				});
			}
		}
	}
	return results;
}
