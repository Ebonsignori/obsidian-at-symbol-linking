import { Notice, type TFile, type App } from "obsidian";
import { fileOption } from "src/types";
import { replaceNewFileVars } from "src/utils/replace-new-file-vars";
import { fileNameNoExtension } from "src/utils/path";
import { type AtSymbolLinkingSettings } from "src/settings/settings";

export async function sharedSelectSuggestion(
	app: App,
	settings: AtSymbolLinkingSettings,
	typedChar: string,
	value: Fuzzysort.KeysResult<fileOption>
): Promise<string> {
	// When user selects "Create new note" option, create the note to link to
	let linkFile;
	if (value?.obj?.isCreateNewOption) {
		if (settings.limitToOneFileWithTrigger.length > 0) {
			const file = app.vault.getAbstractFileByPath(
				value.obj?.filePath
			) as TFile;
			if (!file) {
				new Notice(
					`Unable to get the file at path: ${value.obj.filePath}. Please open an issue on GitHub, as this should not happen.`,
					0
				);
			}
			//edit the file and add a new header
			const headerLevel = "#".repeat(settings.headerLevelForContact <= 1 ? 1: settings.headerLevelForContact);
			const newContent = `${headerLevel} ${value.obj?.query}\n`;
			app.vault.process(file, (content) => {
				if (content.endsWith("\n")) {
					return `${content}${newContent}`;
				}
				return `${content}\n${newContent}`;
			});
		} else {
			let newNoteContents = "";
			if (settings.addNewNoteTemplateFile) {
				const fileTemplate = app.vault.getAbstractFileByPath(
					`${settings.addNewNoteTemplateFile}.md`
				) as TFile;
				newNoteContents = (await app.vault.read(fileTemplate)) || "";
				// Use core template settings to replace variables: {{title}}, {{date}}, {{time}}
				newNoteContents = await replaceNewFileVars(
					app,
					newNoteContents,
					fileNameNoExtension(value.obj?.filePath)
				);
			}

			try {
				linkFile = await app.vault.create(
					value.obj?.filePath,
					newNoteContents
				);
				// Update the alias to the name for displaying the @ link
				value.obj.alias = value.obj?.query;
			} catch (error) {
				new Notice(
					`Unable to create new note at path: ${value.obj?.filePath}. Please open an issue on GitHub, https://github.com/Ebonsignori/obsidian-at-symbol-linking/issues`,
					0
				);
				throw error;
			}
		}
	}

	const currentFile = app.workspace.getActiveFile();
	if (!linkFile) {
		linkFile = app.vault.getAbstractFileByPath(
			value.obj?.filePath
		) as TFile;
	}
	let alias = value.obj?.alias || "";
	const aliasFallBack =
		settings.limitToOneFileWithTrigger.length > 0
			? value.obj?.query ?? value.obj?.fileName
			: value.obj?.fileName;
	if (settings.includeSymbol)
		alias = `${typedChar}${alias || aliasFallBack}`;
	const linkText =
		settings.limitToOneFileWithTrigger.length > 0
			? app.fileManager.generateMarkdownLink(
				linkFile,
				currentFile?.path || "",
				`#${value.obj?.query || value.obj?.fileName}`,
				alias
			  )
			: app.fileManager.generateMarkdownLink(
				linkFile,
				currentFile?.path || "",
				undefined, // we don't care about the subpath
				alias
			  );

	if (linkText.includes("\n")) {
		return linkText.replace(/\n/g, "");
	}
	return linkText;
}
