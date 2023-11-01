import { moment } from "obsidian";
import type { App } from "obsidian";

/**
 * Uses core "templates" plugin option to replace the following variables in the template:
 * {{title}} - The title of the new file
 * {{date}} - The current date
 * {{time}} - The current time
 *
 * @param app - The Obsidian App instance
 * @param templateContent - The content of the template file
 * @param title - The title of the new file
 * @returns The template content with the variables replaced
 */
export async function replaceNewFileVars(
	app: App,
	templateContent: string,
	title: string
): Promise<string> {
	if (!templateContent) return templateContent;

	const coreTemplatesConfigPath = ".obsidian/templates.json";
	let coreTemplatesConfig;
	try {
		coreTemplatesConfig = await app.vault.adapter.read(
			coreTemplatesConfigPath
		);
		coreTemplatesConfig = JSON.parse(coreTemplatesConfig);
	} catch (error) {
		console.error(
			`@ Symbol Linking: Unable to read core plugin templates config at path: ${coreTemplatesConfigPath}`
		);
		console.log(error);
		return templateContent;
	}

	let dateFormat = "YYYY-MM-DD";
	let timeFormat = "HH:mm";
	if (coreTemplatesConfig?.dateFormat) {
		dateFormat = coreTemplatesConfig.dateFormat;
	}
	if (coreTemplatesConfig?.timeFormat) {
		timeFormat = coreTemplatesConfig.timeFormat;
	}

	templateContent = templateContent.replace(
		/{{date}}/g,
		moment().format(dateFormat)
	);
	templateContent = templateContent.replace(
		/{{time}}/g,
		moment().format(timeFormat)
	);
	templateContent = templateContent.replace(/{{title}}/g, title);

	return templateContent;
}
