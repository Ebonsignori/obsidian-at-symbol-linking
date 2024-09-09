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
import { FileSuggestWithPath } from "./file-suggest-path";

export interface AtSymbolLinkingSettings {
	triggerSymbol: string;
	includeSymbol: boolean;
	limitLinkDirectories?: Array<string>;
	limitToOneFile?: Array<string>;
	limitLinkDirectoriesWithTrigger: CustomTriggerPerLimit[];
	limitToOneFileWithTrigger: CustomTriggerPerLimit[];
	_enableOneFile: boolean;
	appendAsHeader: boolean;
	headerLevelForContact: number;

	showAddNewNote: boolean;
	addNewNoteTemplateFile: string;
	addNewNoteDirectory: string;

	useCompatibilityMode: boolean;
	leavePopupOpenForXSpaces: number;

	invalidCharacterRegex: string;
	invalidCharacterRegexFlags: string;

	removeAccents: boolean;
}

export interface CustomTriggerPerLimit {
	triggerSymbol?: string;
	path: string;
}

export const DEFAULT_SETTINGS: AtSymbolLinkingSettings = {
	triggerSymbol: "@",
	limitLinkDirectoriesWithTrigger: [],
	includeSymbol: true,
	limitToOneFileWithTrigger: [],
	appendAsHeader: false,
	headerLevelForContact: 1,
	_enableOneFile: false,

	showAddNewNote: false,
	addNewNoteTemplateFile: "",
	addNewNoteDirectory: "",

	useCompatibilityMode: false,
	leavePopupOpenForXSpaces: 0,

	// eslint-disable-next-line no-useless-escape
	invalidCharacterRegex: `[\[\]^|#]`,
	invalidCharacterRegexFlags: "i",

	removeAccents: true,
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
	shouldReset: boolean;

	constructor(app: App, plugin: AtSymbolLinking) {
		super(app, plugin);
		this.plugin = plugin;
		this.shouldReset = false;
	}

	// On close, reload the plugin
	hide() {
		this.plugin.reloadPlugin(this.shouldReset);
		this.shouldReset = false;
	}

	display(): void {
		this.containerEl.empty();
		this.containerEl.addClass("at-symbol-linking");
		// Begin triggerSymbol option: Determine which symbol triggers the popup
		const triggerSymbolDesc = document.createDocumentFragment();
		triggerSymbolDesc.append("Type this symbol to trigger the popup.");
		new Setting(this.containerEl)
			.setName("Default trigger Symbol")
			.setDesc(triggerSymbolDesc)
			.addText((text) => {
				text.setPlaceholder("@")
					.setValue(this.plugin.settings.triggerSymbol)
					.onChange(async (value: string) => {
						this.plugin.settings.triggerSymbol = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.onblur = () => {
					this.display();
					this.validate();
				};
			});

		// Begin includeSymbol option: Determine whether to include @ symbol in link
		const includeSymbolDesc = document.createDocumentFragment();
		includeSymbolDesc.append(
			`Include the trigger symbol (default: ${this.plugin.settings.triggerSymbol}) prefixing the final link text`,
			includeSymbolDesc.createEl("br"),
			includeSymbolDesc.createEl("em", {
				text: `E.g. [${
					this.plugin.settings.includeSymbol
						? this.plugin.settings.triggerSymbol
						: ""
				}evan](./evan)`,
			})
		);
		new Setting(this.containerEl)
			.setName(`Include the trigger symbol`)
			.setDesc(includeSymbolDesc)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.includeSymbol)
					.onChange(async (value: boolean) => {
						this.plugin.settings.includeSymbol = value;
						await this.plugin.saveSettings();
						this.display();
					})
			);
		// End includeSymbol option
		// Start limitToOneFile option
		const messageAboutLevel = this.plugin.settings.headerLevelForContact === 0 ? "include all headers" : `current heading level: ${this.plugin.settings.headerLevelForContact}`;
		if (this.plugin.settings.limitLinkDirectoriesWithTrigger.length=== 0) {
			new Setting(this.containerEl)
				.setName("Limit links to files")
				.setHeading()
				.setDesc(
					`Limit to one files for contact linking, using the header (${messageAboutLevel}) as the contact name.
				Leave empty to use the directories structure instead.`
				)
				.addButton((button: ButtonComponent) => {
					button
						.setTooltip("Add a file")
						.setButtonText("+")
						.setCta()
						.onClick(async () => {
							this.plugin.settings.limitToOneFileWithTrigger.push({path: "", triggerSymbol: this.plugin.settings.triggerSymbol});
							this.plugin.settings._enableOneFile = true;
							await this.plugin.saveSettings();
							return this.display();
						});
				});
		}
		this.plugin.settings.limitToOneFileWithTrigger.forEach((file, index) => {
			const newFileSetting = new Setting(this.containerEl)
				.setClass("at-symbol-linking-folder-container")
				.addSearch((cb) => {
					new FileSuggestWithPath(this.app, cb.inputEl);
					cb.setPlaceholder("File")
						.setValue(file.path)
						.onChange(async (newFile) => {
							this.plugin.settings.limitToOneFileWithTrigger[index].path =
								newFile.trim();
							await this.plugin.saveSettings();
						});
					cb.inputEl.onblur = () => {
						this.validate();
					};
				})
				.addText((text) => {
					text
						.setPlaceholder("Trigger symbol")
						.setValue(file.triggerSymbol ?? this.plugin.settings.triggerSymbol)
						.onChange(async (value) => {
							this.plugin.settings.limitToOneFileWithTrigger[
								index
							].triggerSymbol = value;
							await this.plugin.saveSettings();
						})
						.inputEl.addClass("min-width");
				})
				.addExtraButton((cb) => {
					cb.setIcon("up-chevron-glyph")
						.setTooltip("Move up")
						.onClick(async () => {
							arrayMove(
								this.plugin.settings.limitToOneFileWithTrigger,
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
								this.plugin.settings.limitToOneFileWithTrigger,
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
							this.plugin.settings.limitToOneFileWithTrigger.splice(index, 1);
							await this.plugin.saveSettings();
							this.display();
						});
				});
			newFileSetting.controlEl.addClass("at-symbol-linking-folder-setting");
			newFileSetting.infoEl.remove();
		});
		
		if (this.plugin.settings.limitToOneFileWithTrigger.length === 0 && this.plugin.settings.limitLinkDirectoriesWithTrigger.length === 0) this.plugin.settings._enableOneFile = false;
		
		if (this.plugin.settings._enableOneFile) {
			const snRdTh = this.plugin.settings.headerLevelForContact === 2 ? "nd" : this.plugin.settings.headerLevelForContact === 3 ? "rd" : this.plugin.settings.headerLevelForContact === 1 ? "st" : "th";
			const atTheLevel = this.plugin.settings.headerLevelForContact === 0 ? "at the 1st level" : `at the ${this.plugin.settings.headerLevelForContact}${snRdTh} level`;
			//Begin headerLevelForContact option
			new Setting(this.containerEl)
				.setName("Header level for contact name")
				.addSlider((slider) => {
					slider
						.setLimits(0, 6, 1)
						.setValue(this.plugin.settings.headerLevelForContact)
						.onChange(async (value: number) => {
							this.plugin.settings.headerLevelForContact = value;
							await this.plugin.saveSettings();
						});
					slider.sliderEl.onmouseleave = () => {
						this.display();
					};
					slider.sliderEl.ariaLabel = `Header level for contact name\nCurrent: ${this.plugin.settings.headerLevelForContact}`;
				
				});
			//End headerLevelForContact option
			
			// Begin appendAsHeader option
			new Setting(this.containerEl)
				.setName("Add new header")
				.setHeading();
			new Setting(this.containerEl)
				.setName("Append as header if it doesn't exist")
				.setDesc(
					`If the header doesn't exist when ${this.plugin.settings.triggerSymbol} linking, add an option to create the header ${atTheLevel} in the end of the file.`
				)
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.appendAsHeader)
						.onChange((value: boolean) => {
							this.plugin.settings.appendAsHeader = value;
							this.plugin.saveSettings();
						})
				);
		// End appendAsHeader option
		} else {
			// Begin limitLinksToFolders option: limit which folders links are sourced from
			const ruleDesc = document.createDocumentFragment();
			ruleDesc.append(
				`${this.plugin.settings.triggerSymbol} linking will only source links from the following folders.`,
				ruleDesc.createEl("br"),
				`For example, you might only want contacts in the Contacts/ folder to be linked when you type ${this.plugin.settings.triggerSymbol}.`,
				ruleDesc.createEl("br"),
				ruleDesc.createEl("em", {
					text: "If no folders are added, links will be sourced from all folders.",
				})
			);

			new Setting(this.containerEl)
				.setName("Limit links to folders")
				.setHeading()
				.setDesc(ruleDesc)
				.addButton((button: ButtonComponent) => {
					button
						.setTooltip("Add limit folder")
						.setButtonText("+")
						.setCta()
						.onClick(async () => {
							this.plugin.settings.limitLinkDirectoriesWithTrigger.push({path:"", triggerSymbol: this.plugin.settings.triggerSymbol});
							this.plugin.settings._enableOneFile = false;
							await this.plugin.saveSettings();
							return this.display();
						});
				});

			this.plugin.settings.limitLinkDirectoriesWithTrigger.forEach(
				(directory, index) => {
					const newDirectorySetting = new Setting(this.containerEl)
						.setClass("at-symbol-linking-folder-container")
						.addSearch((cb) => {
							new FolderSuggest(this.app, cb.inputEl);
							cb.setPlaceholder("Folder")
								.setValue(directory.path)
								.onChange(async (newFolder) => {
									this.plugin.settings.limitLinkDirectoriesWithTrigger[
										index
									].path = newFolder.trim();
									await this.plugin.saveSettings();
								});
							cb.inputEl.onblur = () => {
								this.validate();
							};
						})
						.addText((text) => {
							text
								.setPlaceholder("Trigger symbol")
								.setValue(directory.triggerSymbol ?? this.plugin.settings.triggerSymbol)
								.onChange(async (value) => {
									this.plugin.settings.limitLinkDirectoriesWithTrigger[
										index
									].triggerSymbol = value;
									await this.plugin.saveSettings();
								})
								.inputEl.addClass("min-width");
						})
						.addExtraButton((cb) => {
							cb.setIcon("up-chevron-glyph")
								.setTooltip("Move up")
								.onClick(async () => {
									arrayMove(
										this.plugin.settings
											.limitLinkDirectoriesWithTrigger,
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
										this.plugin.settings
											.limitLinkDirectoriesWithTrigger,
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
									this.plugin.settings.limitLinkDirectoriesWithTrigger.splice(
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
					`If the note doesn't exist when ${this.plugin.settings.triggerSymbol} linking, add an option to create the note.`
				)
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.showAddNewNote)
						.onChange(async (value: boolean) => {
							this.plugin.settings.showAddNewNote = value;
							await this.plugin.saveSettings();
							this.display();
						})
				);
			// End add new note option

			if (this.plugin.settings.showAddNewNote) {
				// Begin add new note template folder
				const newNoteTemplateDesc = document.createDocumentFragment();
				newNoteTemplateDesc.append(
					`Template to use when creating a new note from ${this.plugin.settings.triggerSymbol} link.`,
					newNoteTemplateDesc.createEl("br"),
					"Uses formats from the ",
					newNoteTemplateDesc.createEl("a", {
						text: "core templates plugin",
						href: "https://help.obsidian.md/Plugins/Templates",
					}),
					" to replace the following variables in the template:",
					newNoteTemplateDesc.createEl("br"),
					newNoteTemplateDesc.createEl("code", {
						text: "{{title}}",
					}),
					" - The title of the new file",
					newNoteTemplateDesc.createEl("br"),
					newNoteTemplateDesc.createEl("code", {
						text: "{{date}}",
					}),
					" - The current date",
					newNoteTemplateDesc.createEl("br"),
					newNoteTemplateDesc.createEl("code", {
						text: "{{time}}",
					}),
					" - The current time"
				);
				new Setting(this.containerEl)
					.setName("Add new note template")
					.setDesc(newNoteTemplateDesc)
					.addSearch((cb) => {
						new FileSuggest(this.app, cb.inputEl);
						cb.setPlaceholder("No template (blank note)")
							.setValue(
								this.plugin.settings.addNewNoteTemplateFile
							)
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
						`Folder to create new notes in when using ${this.plugin.settings.triggerSymbol} linking. If the limit directories is used, the folder will be the limited directory selected by the trigger.`
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

		new Setting(this.containerEl)
			.setName("Suggestion popup behavior")
			.setHeading();

		// Begin useCompatibilityMode option
		const useCompatibilityModeDesc = document.createDocumentFragment();
		useCompatibilityModeDesc.append(
			useCompatibilityModeDesc.createEl("br"),
			"Renders an HTML popup in place of the native Obsidian popup.",
			useCompatibilityModeDesc.createEl("br"),
			"Useful if you other plugins are interfering with the popup (e.g. the Tasks plugin).",
			useCompatibilityModeDesc.createEl("br"),
			useCompatibilityModeDesc.createEl("em", {
				text: "May be slower than the native popup.",
			})
		);
		new Setting(this.containerEl)
			.setName("Use compatibility mode")
			.setDesc(useCompatibilityModeDesc)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.useCompatibilityMode)
					.onChange((value: boolean) => {
						this.shouldReset = true;
						this.plugin.settings.useCompatibilityMode = value;
						this.plugin.saveSettings();
						this.plugin.registerPopup();
						this.display();
					})
			);
		// End useCompatibilityMode option

		// Begin leavePopupOpenForXSpaces option
		const leavePopupOpenDesc = document.createDocumentFragment();
		leavePopupOpenDesc.append(
			`When ${this.plugin.settings.triggerSymbol} linking, you might want to type a full name e.g. "Brandon Sanderson" without the popup closing.`,
			leavePopupOpenDesc.createEl("br"),
			leavePopupOpenDesc.createEl("em", {
				text: "When set above 0, you'll need to press escape, return/enter, or type over X spaces to close the popup.",
			})
		);
		new Setting(this.containerEl)
			.setName("Leave popup open for X spaces")
			.setDesc(leavePopupOpenDesc)
			.addText((text) => {
				text.setPlaceholder("0")
					.setValue(
						this.plugin.settings.leavePopupOpenForXSpaces?.toString()
					)
					.onChange(async (value) => {
						this.plugin.settings.leavePopupOpenForXSpaces =
							parseInt(value, 10);
						await this.plugin.saveSettings();
					});
				text.inputEl.onblur = () => {
					this.validate();
				};
			});
		// End leavePopupOpenForXSpaces option

		new Setting(this.containerEl).setName("Advanced settings").setHeading();

		// Begin invalid character regex option
		const invalidCharacterRegexDesc = document.createDocumentFragment();
		invalidCharacterRegexDesc.append(
			invalidCharacterRegexDesc.createEl("br"),
			"Characters typed that match this regex will not be included in the final search query in compatibility mode.",
			invalidCharacterRegexDesc.createEl("br"),
			"In normal mode, the popup will close when an invalid character is typed."
		);

		new Setting(this.containerEl)
			.setName("Invalid character Regex")
			.setDesc(invalidCharacterRegexDesc)
			.addText((text) => {
				text.setPlaceholder(this.plugin.settings.invalidCharacterRegex)
					.setValue(this.plugin.settings.invalidCharacterRegex)
					.onChange(async (value) => {
						this.plugin.settings.invalidCharacterRegex = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.onblur = () => {
					this.validate("invalidCharacterRegex");
				};
			});
		// End valid character regex option

		// Begin valid character regex flags option
		const invalidCharacterRegexFlagsDesc =
			document.createDocumentFragment();
		invalidCharacterRegexFlagsDesc.append(
			"Flags to use with the invalid character regex."
		);

		new Setting(this.containerEl)
			.setName("Invalid character Regex flags")
			.setDesc(invalidCharacterRegexFlagsDesc)
			.addText((text) => {
				text.setPlaceholder(
					this.plugin.settings.invalidCharacterRegexFlags
				)
					.setValue(this.plugin.settings.invalidCharacterRegexFlags)
					.onChange(async (value) => {
						this.plugin.settings.invalidCharacterRegexFlags = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.onblur = () => {
					this.validate("invalidCharacterRegexFlags");
				};
			});
		// End valid character regex flags option

		// Begin remove accents option
		new Setting(this.containerEl)
			.setName("Remove accents from search query")
			.setDesc(
				"e.g. é -> e when searching or creating links via the popup."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.removeAccents)
					.onChange((value: boolean) => {
						this.plugin.settings.removeAccents = value;
						this.plugin.saveSettings();
					})
			);
	}

	async validate(editedSetting?: string) {
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

		// triggerSymbol should be a single character
		if (settings.triggerSymbol.length !== 1) {
			new Notice(`Trigger symbol must be a single character.`);
			await updateSetting(
				"triggerSymbol",
				settings.triggerSymbol.length ? settings.triggerSymbol[0] : "@"
			);
		}

		// Folders should exist
		for (let i = 0; i < settings.limitLinkDirectoriesWithTrigger.length; i++) {
			const folder = settings.limitLinkDirectoriesWithTrigger[i];
			if (folder.path === "") {
				continue;
			}
			const folderFile = this.app.vault.getAbstractFileByPath(folder.path);
			if (!folderFile) {
				new Notice(
					`Unable to find folder at path: ${folder}. Please add it if you want to limit links to this folder.`
				);
				const newFolders = [...settings.limitLinkDirectoriesWithTrigger];
				newFolders[i].path = "";
				await updateSetting("limitLinkDirectories", newFolders);
			}
		}

		// Template file should exist when add new note option is enabled
		if (settings.showAddNewNote && settings.addNewNoteTemplateFile) {
			const templateFile = this.app.vault.getAbstractFileByPath(
				`${settings.addNewNoteTemplateFile}.md`
			);
			if (!templateFile) {
				new Notice(
					`Unable to find template file at path: ${settings.addNewNoteTemplateFile}.md`
				);
				await updateSetting("addNewNoteTemplateFile", "");
			}
		}

		// Destination directory should exist when add new note option is enabled
		if (settings.showAddNewNote && settings.addNewNoteDirectory) {
			const templateFile = this.app.vault.getAbstractFileByPath(
				`${settings.addNewNoteDirectory}`
			);
			if (!templateFile) {
				new Notice(
					`Unable to find folder for new notes at path: ${settings.addNewNoteDirectory}. Please add it if you want to create new notes in this folder.`
				);
				await updateSetting("addNewNoteDirectory", "");
			}
		}

		// Leave popup open for X spaces should be a number
		if (
			isNaN(parseInt(settings.leavePopupOpenForXSpaces.toString())) ||
			settings.leavePopupOpenForXSpaces < 0
		) {
			await updateSetting("leavePopupOpenForXSpaces", 0);
		}

		// Regex should be valid and not be empty
		if (settings.invalidCharacterRegex?.trim() === "") {
			await updateSetting(
				"invalidCharacterRegex",
				DEFAULT_SETTINGS.invalidCharacterRegex
			);
		}
		try {
			new RegExp(
				settings.invalidCharacterRegex,
				settings.invalidCharacterRegexFlags
			);
		} catch (e) {
			new Notice(`Invalid regex or flags`);
			if (editedSetting === "invalidCharacterRegex") {
				await updateSetting(
					"invalidCharacterRegex",
					DEFAULT_SETTINGS.invalidCharacterRegex
				);
			} else if (editedSetting === "invalidCharacterRegexFlags") {
				await updateSetting(
					"invalidCharacterRegexFlags",
					DEFAULT_SETTINGS.invalidCharacterRegexFlags
				);
			}
		}
	}
}
