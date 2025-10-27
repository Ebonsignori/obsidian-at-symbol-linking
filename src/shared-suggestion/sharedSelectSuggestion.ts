import { Notice, type TFile, type App } from "obsidian";
import { fileOption } from "src/types";
import { replaceNewFileVars } from "src/utils/replace-new-file-vars";
import { fileNameNoExtension } from "src/utils/path";
import { type AtSymbolLinkingSettings } from "src/settings/settings";

export async function sharedSelectSuggestion(
	app: App,
	settings: AtSymbolLinkingSettings,
	value: Fuzzysort.KeysResult<fileOption>,
	triggeredSymbol?: string
): Promise<string> {
	// When user selects "Create new note" option, create the note to link to
	let linkFile;
	if (value?.obj?.isCreateNewOption) {
		// If trying to create a note without a query/name, show notice and return
		if (!value?.obj?.query || !value?.obj?.filePath) {
			new Notice("Please type a note name before creating");
			return "";
		}
		let newNoteContents = "";
		// Use template from the fileOption if available, otherwise fall back to old settings
		const templatePath = value.obj?.newNoteTemplate || settings.addNewNoteTemplateFile;
		if (templatePath) {
			const fileTemplate = app.vault.getAbstractFileByPath(
				`${templatePath}.md`
			) as TFile;
			if (fileTemplate) {
				newNoteContents = (await app.vault.read(fileTemplate)) || "";
				// Use core template settings to replace variables: {{title}}, {{date}}, {{time}}
				newNoteContents = await replaceNewFileVars(
					app,
					newNoteContents,
					fileNameNoExtension(value.obj?.filePath)
				);
			}
		}

		try {
			linkFile = await app.vault.create(
				value.obj?.filePath,
				newNoteContents
			);
			// Update the alias to the name for displaying the @ link
			value.obj.alias = value.obj?.query;
		} catch (error) {
			// Check if error is due to file already existing
			if (error?.message?.includes("already exists") || error?.message?.includes("File already exists")) {
				new Notice(
					`Note "${value.obj?.query}" already exists at path: ${value.obj?.filePath}`
				);
			} else {
				new Notice(
					`Unable to create new note at path: ${value.obj?.filePath}. Please open an issue on GitHub, https://github.com/Ebonsignori/obsidian-at-symbol-linking/issues`,
					0
				);
			}
			return "";
		}
	}

	const currentFile = app.workspace.getActiveFile();
	if (!linkFile) {
		linkFile = app.vault.getAbstractFileByPath(
			value.obj?.filePath
		) as TFile;
	}
	let alias = (!settings.doNotPasteAlias && value.obj?.alias) || "";

	if (settings.includeSymbol) {
		// Use the triggered symbol if provided, otherwise fall back to global trigger symbol
		const symbolToInclude = triggeredSymbol || settings.globalTriggerSymbol;
		alias = `${symbolToInclude}${alias || value.obj?.fileName}`;
	}
	let linkText = app.fileManager.generateMarkdownLink(
		linkFile,
		currentFile?.path || "",
		undefined, // we don't care about the subpath
		alias
	);

	if (linkText.includes("\n")) {
		linkText = linkText.replace(/\n/g, "");
	}

	return linkText;
}
