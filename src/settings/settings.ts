import { App, ButtonComponent, PluginSettingTab, Setting } from "obsidian";
import AtSymbolLinking from "src/main";
import { FolderSuggest } from "./folder-suggest";

export enum LinkType {
	OBSIDIAN_STYLE = "Obsidian Style",
	MARKDOWN_STYLE = "Markdown Style",
}

export interface AtSymbolLinkingSettings {
	limitLinkDirectories: Array<string>;
	linkType: LinkType;
	includeSymbol: boolean;
}

export const DEFAULT_SETTINGS: AtSymbolLinkingSettings = {
	limitLinkDirectories: [],
	linkType: LinkType.OBSIDIAN_STYLE,
	includeSymbol: true,
};

const arrayMove = <T>(array: T[], fromIndex: number, toIndex: number): void => {
	if (toIndex < 0 || toIndex === array.length) {
		return;
	}
	const temp = array[fromIndex];
	array[fromIndex] = array[toIndex];
	array[toIndex] = temp;
};

export class SettingsTab extends PluginSettingTab {
	plugin: AtSymbolLinking;

	constructor(app: App, plugin: AtSymbolLinking) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Add a description to the top of the settings tab
		const descEl = document.createDocumentFragment();
		descEl.append(
			descEl.createEl("strong", { text: "What is @ Symbol Linking?" }),
			descEl.createEl("br"),
			"This plugin allows you to type @ and then a file name to link to that file.",
			descEl.createEl("br"),
			descEl.createEl("em", {
				text: 'For example type "@evan" to link to /contacts/evan.md',
			})
		);
		new Setting(this.containerEl).setDesc(descEl);

		// Begin Rule 1: Determine which type of link to create
		const linkTypeDesc = document.createDocumentFragment();
		linkTypeDesc.append(
			"Choose which type of link to create",
			descEl.createEl("br"),
			descEl.createEl("strong", { text: "Obsidian Style" }),
			' will create a link in the format "[[filePath|linkText]]"',
			descEl.createEl("br"),
			descEl.createEl("strong", { text: "Markdown Style" }),
			' will create a link in the format "[linkText](filePath)"'
		);
		new Setting(this.containerEl)
			.setName("Link Type")
			.setDesc(linkTypeDesc)
			.addDropdown((dropDown) =>
				dropDown
					.addOption("Obsidian Style", LinkType.OBSIDIAN_STYLE)
					.addOption("Markdown Style", LinkType.MARKDOWN_STYLE)
					.setValue(this.plugin.settings.linkType)
					.onChange(async (value: LinkType) => {
						this.plugin.settings.linkType = value;
						this.plugin.saveData(this.plugin.settings);
						this.display();
					})
			);
		// End Rule 1

		// Begin Rule 2: Determine which type of link to create
		const includeSymbolDesc = document.createDocumentFragment();
		linkTypeDesc.append(
			"Include the @ symbol in the found link",
			descEl.createEl("br"),
			"Toggle off to remove the @ symbol from the final link"
		);
		new Setting(this.containerEl)
			.setName("Include @ Symbol")
			.setDesc(includeSymbolDesc)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.includeSymbol)
					.onChange((value: boolean) => {
						this.plugin.settings.includeSymbol = value;
						this.plugin.saveData(this.plugin.settings);
						this.display();
					})
			);
		// End Rule 2

		// Begin Rule 3: limit which folders links are sourced from
		const ruleDesc = document.createDocumentFragment();
		ruleDesc.append(
			"@ linking will only source links from the following folders.",
			descEl.createEl("br"),
			"For example, if you only want contacts in the Contacts/ folder to be linked",
			descEl.createEl("br"),
			"when you type @, add Contacts/ to the list of folders.",
			descEl.createEl("br"),
			descEl.createEl("em", {
				text: "If no folders are added, links will be sourced from all folders.",
			})
		);

		new Setting(this.containerEl)
			.setName("Limit links to folders")
			.setDesc(ruleDesc)
			.addButton((button: ButtonComponent) => {
				button
					.setTooltip("Add limit folder")
					.setButtonText("+")
					.setCta()
					.onClick(async () => {
						this.plugin.settings.limitLinkDirectories.push("");
						await this.plugin.saveSettings();
						this.display();
					});
			});

		this.plugin.settings.limitLinkDirectories.forEach(
			(directory, index) => {
				const newDirectorySetting = new Setting(this.containerEl)
					.addSearch((cb) => {
						new FolderSuggest(this.app, cb.inputEl);
						cb.setPlaceholder("Folder")
							.setValue(directory)
							.onChange(async (newFolder) => {
								this.plugin.settings.limitLinkDirectories[
									index
								] = newFolder.trim();
								await this.plugin.saveSettings();
							});
					})
					.addExtraButton((cb) => {
						cb.setIcon("up-chevron-glyph")
							.setTooltip("Move up")
							.onClick(async () => {
								arrayMove(
									this.plugin.settings.limitLinkDirectories,
									index,
									index - 1
								);
								await this.plugin.saveSettings();
								this.display();
							});
					})
					.addExtraButton((cb) => {
						cb.setIcon("down-chevron-glyph")
							.setTooltip("Move down")
							.onClick(async () => {
								arrayMove(
									this.plugin.settings.limitLinkDirectories,
									index,
									index + 1
								);
								await this.plugin.saveSettings();
								this.display();
							});
					})
					.addExtraButton((cb) => {
						cb.setIcon("cross")
							.setTooltip("Delete")
							.onClick(async () => {
								this.plugin.settings.limitLinkDirectories.splice(
									index,
									1
								);
								await this.plugin.saveSettings();
								this.display();
							});
					});
				newDirectorySetting.controlEl.addClass(
					"at-symbol-linking-folder-setting"
				);
				newDirectorySetting.infoEl.remove();
			}
		);
		// End Rule 3
	}
}
