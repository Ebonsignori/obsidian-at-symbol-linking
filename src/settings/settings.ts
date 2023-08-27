import {
	App,
	ButtonComponent,
	Notice,
	PluginSettingTab,
	Setting,
} from "obsidian";
import AtSymbolLinking from "src/main";
import { FolderSuggest } from "./folder-suggest";
import { FileSuggest } from "./file-suggest";

export interface AtSymbolLinkingSettings {
	limitLinkDirectories: Array<string>;
	includeSymbol: boolean;

	showAddNewNote: boolean;
	addNewNoteTemplateFile: string;
	addNewNoteDirectory: string;
}

export const DEFAULT_SETTINGS: AtSymbolLinkingSettings = {
	limitLinkDirectories: [],
	includeSymbol: true,

	showAddNewNote: false,
	addNewNoteTemplateFile: "",
	addNewNoteDirectory: "",
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
		this.containerEl.empty();

		this.containerEl.appendChild(
			createHeading(this.containerEl, "At Symbol (@) Linking Settings")
		);

		// Begin includeSymbol option: Determine whether to include @ symbol in link
		const includeSymbolDesc = document.createDocumentFragment();
		includeSymbolDesc.append(
			"Include the @ symbol prefixing the final link text",
			includeSymbolDesc.createEl("br"),
			includeSymbolDesc.createEl("em", {
				text: `E.g. [${this.plugin.settings.includeSymbol ? '@' : ''}evan](./evan)`
			})
		);
		new Setting(this.containerEl)
			.setName("Include @ symbol")
			.setDesc(includeSymbolDesc)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.includeSymbol)
					.onChange((value: boolean) => {
						this.plugin.settings.includeSymbol = value;
						this.plugin.saveSettings();
						this.display();
					})
			);
		// End includeSymbol option

		// Begin limitLinksToFolders option: limit which folders links are sourced from
		const ruleDesc = document.createDocumentFragment();
		ruleDesc.append(
			"@ linking will only source links from the following folders.",
			ruleDesc.createEl("br"),
			"For example, you might only want contacts in the Contacts/ folder to be linked when you type @.",
			ruleDesc.createEl("br"),
			ruleDesc.createEl("em", {
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
						return this.display();
					});
			});

		this.plugin.settings.limitLinkDirectories.forEach(
			(directory, index) => {
				const newDirectorySetting = new Setting(this.containerEl)
					.setClass("at-symbol-linking-folder-container")
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
						cb.inputEl.onblur = () => {
							this.validate();
						};
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
		// End limitLinksToFolders option

		new Setting(this.containerEl).setName("Add new note").setHeading();

		// Begin add new note option
		new Setting(this.containerEl)
			.setName("Add new note if it doesn't exist")
			.setDesc(
				"If the note doesn't exist when @ linking, add an option to create the note."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showAddNewNote)
					.onChange((value: boolean) => {
						this.plugin.settings.showAddNewNote = value;
						this.plugin.saveSettings();
						this.display();
					})
			);
		// End add new note option

		if (this.plugin.settings.showAddNewNote) {
			// Begin add new note template folder
			new Setting(this.containerEl)
				.setName("Add new note template")
				.setDesc(
					"Template to use when creating a new note from @ link."
				)
				.addSearch((cb) => {
					new FileSuggest(this.app, cb.inputEl);
					cb.setPlaceholder("No template (blank note)")
						.setValue(this.plugin.settings.addNewNoteTemplateFile)
						.onChange(async (newFile) => {
							this.plugin.settings.addNewNoteTemplateFile =
								newFile.trim();
							await this.plugin.saveSettings();
						});
					cb.inputEl.onblur = () => {
						this.validate();
					};
				});
			// End add new note template folder

			// Begin add new note directory
			new Setting(this.containerEl)
				.setName("Add new note folder")
				.setDesc(
					"Folder to create new notes in when using @ linking."
				)
				.addSearch((cb) => {
					new FolderSuggest(this.app, cb.inputEl);
					cb.setPlaceholder("No folder (root)")
						.setValue(this.plugin.settings.addNewNoteDirectory)
						.onChange(async (newFolder) => {
							this.plugin.settings.addNewNoteDirectory =
								newFolder.trim();
							await this.plugin.saveSettings();
						});
					cb.inputEl.onblur = () => {
						this.validate();
					};
				});
			// End add new note directory
		}
	}

	async validate() {
		const settings = this.plugin.settings;
		const updateSetting = async (
			setting: keyof AtSymbolLinkingSettings,
			value: any
		) => {
			// @ts-expect-error update setting with any
			this.plugin.settings[setting] = value;
			await this.plugin.saveSettings();
			return this.display();
		};

		for (let i = 0; i < settings.limitLinkDirectories.length; i++) {
			const folder = settings.limitLinkDirectories[i];
			if (folder === "") {
				continue;
			}
			const folderFile = this.app.vault.getAbstractFileByPath(folder);
			if (!folderFile) {
				new Notice(
					`Unable to find folder at path: ${folder}. Please add it if you want to limit links to this folder.`
				);
				const newFolders = [...settings.limitLinkDirectories];
				newFolders[i] = "";
				await updateSetting("limitLinkDirectories", newFolders);
			}
		}

		if (settings.showAddNewNote && settings.addNewNoteTemplateFile) {
			const templateFile = this.app.vault.getAbstractFileByPath(
				`${settings.addNewNoteTemplateFile}.md`
			);
			if (!templateFile) {
				new Notice(
					`Unable to find template file at path: ${settings.addNewNoteTemplateFile}.md`
				);
				return updateSetting("addNewNoteTemplateFile", "");
			}
		}

		if (settings.showAddNewNote && settings.addNewNoteDirectory) {
			const templateFile = this.app.vault.getAbstractFileByPath(
				`${settings.addNewNoteDirectory}`
			);
			if (!templateFile) {
				new Notice(
					`Unable to find folder for new notes at path: ${settings.addNewNoteDirectory}. Please add it if you want to create new notes in this folder.`
				);
				return updateSetting("addNewNoteDirectory", "");
			}
		}
	}
}

function createHeading(el: HTMLElement, text: string, level = 2) {
	const heading = el.createEl(`h${level}` as keyof HTMLElementTagNameMap, {
		text,
	});
	heading.addClass("at-symbol-linking-heading");
	return heading;
}
