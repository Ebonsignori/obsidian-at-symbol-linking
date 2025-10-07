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

export interface FolderSymbolMapping {
	folder: string;
	symbol?: string;
}

export interface NewNoteFolderMapping {
	folder: string;
	symbol: string;
	template?: string;
}

export interface AtSymbolLinkingSettings {
	globalTriggerSymbol: string;
	includeSymbol: boolean;
	limitLinkDirectories: Array<FolderSymbolMapping>;

	showAddNewNote: boolean;
	addNewNoteFolders: Array<NewNoteFolderMapping>;
	// Deprecated settings (kept for backward compatibility and migration)
	addNewNoteTemplateFile: string;
	addNewNoteDirectory: string;

	useCompatibilityMode: boolean;
	leavePopupOpenForXSpaces: number;
	allowedCodeBlockTypes: Array<string>;

	invalidCharacterRegex: string;
	invalidCharacterRegexFlags: string;

	removeAccents: boolean;
}

export const DEFAULT_SETTINGS: AtSymbolLinkingSettings = {
	globalTriggerSymbol: "@",
	limitLinkDirectories: [],
	includeSymbol: true,

	showAddNewNote: false,
	addNewNoteFolders: [],
	addNewNoteTemplateFile: "",
	addNewNoteDirectory: "",

	useCompatibilityMode: false,
	leavePopupOpenForXSpaces: 0,
	allowedCodeBlockTypes: [],

	// eslint-disable-next-line no-useless-escape
	invalidCharacterRegex: `[\\[\\]^|#]`,
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

		// Begin globalTriggerSymbol option: Determine which symbol triggers the popup
		const globalTriggerSymbolDesc = document.createDocumentFragment();
		globalTriggerSymbolDesc.append(
			"Type this symbol to trigger the popup."
		);
		new Setting(this.containerEl)
			.setName("Global Trigger Symbol")
			.setDesc(globalTriggerSymbolDesc)
			.addText((text) => {
				text.setPlaceholder("@")
					.setValue(this.plugin.settings.globalTriggerSymbol)
					.onChange((value: string) => {
						this.plugin.settings.globalTriggerSymbol = value;
						this.plugin.saveSettings();
					});
				text.inputEl.onblur = () => {
					this.display();
					this.validate();
				};
			});

		// Begin includeSymbol option: Determine whether to include the linking symbol in link
		const includeSymbolDesc = document.createDocumentFragment();
		includeSymbolDesc.append(
			`Include the linking symbol in the final link text`,
			includeSymbolDesc.createEl("br"),
			includeSymbolDesc.createEl("em", {
				text: `E.g. [${
					this.plugin.settings.includeSymbol
						? this.plugin.settings.globalTriggerSymbol
						: ""
				}evan](./evan)`,
			})
		);
		new Setting(this.containerEl)
			.setName(`Include prefixing link symbol`)
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
			`Limit symbols to only source suggestions from the following folders.`,
			ruleDesc.createEl("br"),
			`For example, you might only want contacts in the Contacts/ folder to be linked when you type ${this.plugin.settings.globalTriggerSymbol}.`,
			ruleDesc.createEl("br"),
			"If no limits are added to global trigger symbol, it will source from all folders."
		);

		new Setting(this.containerEl)
			.setName("Limit links to folders by symbol")
			.setDesc(ruleDesc)
			.addButton((button: ButtonComponent) => {
				button
					.setTooltip("Add limit folder")
					.setButtonText("+")
					.setCta()
					.onClick(async () => {
						this.plugin.settings.limitLinkDirectories.push({
							folder: "",
							symbol: "",
						});
						await this.plugin.saveSettings();
						return this.display();
					});
			});

		this.plugin.settings.limitLinkDirectories.forEach((mapping, index) => {
			const newDirectorySetting = new Setting(this.containerEl)
				.setClass("at-symbol-linking-folder-container")
				.addText((text) => {
					text.setPlaceholder("Symbol")
						.setValue(mapping.symbol || "")
						.onChange(async (value: string) => {
							this.plugin.settings.limitLinkDirectories[
								index
							].symbol = value;
							await this.plugin.saveSettings();
						});
					text.inputEl.onblur = () => {
						this.validate();
					};
					text.inputEl.style.width = "70px";
				})
				.addSearch((cb) => {
					new FolderSuggest(this.app, cb.inputEl);
					cb.setPlaceholder("Folder")
						.setValue(mapping.folder)
						.onChange(async (newFolder) => {
							this.plugin.settings.limitLinkDirectories[
								index
							].folder = newFolder.trim();
							await this.plugin.saveSettings();
						});
					cb.inputEl.onblur = () => {
						this.validate();
					};
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
		});
		// End limitLinksToFolders option

		new Setting(this.containerEl).setName("Add new note").setHeading();

		// Begin add new note option
		new Setting(this.containerEl)
			.setName("Add new note if it doesn't exist")
			.setDesc(
				`If the note doesn't exist when symbol linking, add an option to create the note.`
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
			// Begin add new notes for folders by symbol
			const newNoteFoldersDesc = document.createDocumentFragment();
			newNoteFoldersDesc.append(
				`Configure folders where new notes can be created with specific symbols.`,
				newNoteFoldersDesc.createEl("br"),
				"Each symbol must be unique. Templates use formats from the ",
				newNoteFoldersDesc.createEl("a", {
					text: "core templates plugin",
					href: "https://help.obsidian.md/Plugins/Templates",
				}),
				" (",
				newNoteFoldersDesc.createEl("code", {
					text: "{{title}}",
				}),
				", ",
				newNoteFoldersDesc.createEl("code", {
					text: "{{date}}",
				}),
				", ",
				newNoteFoldersDesc.createEl("code", {
					text: "{{time}}",
				}),
				")."
			);

			new Setting(this.containerEl)
				.setName("Add new notes for folders by symbol")
				.setDesc(newNoteFoldersDesc)
				.addButton((button: ButtonComponent) => {
					button
						.setTooltip("Add folder")
						.setButtonText("+")
						.setCta()
						.onClick(async () => {
							this.plugin.settings.addNewNoteFolders.push({
								folder: "",
								symbol: "",
								template: "",
							});
							await this.plugin.saveSettings();
							return this.display();
						});
				});

			this.plugin.settings.addNewNoteFolders.forEach((mapping, index) => {
				const newFolderSetting = new Setting(this.containerEl)
					.setClass("at-symbol-linking-folder-container")
					.addText((text) => {
						text.setPlaceholder("Symbol")
							.setValue(mapping.symbol || "")
							.onChange(async (value: string) => {
								this.plugin.settings.addNewNoteFolders[
									index
								].symbol = value;
								await this.plugin.saveSettings();
							});
						text.inputEl.onblur = () => {
							this.validate();
						};
						text.inputEl.style.width = "70px";
					})
					.addSearch((cb) => {
						new FolderSuggest(this.app, cb.inputEl);
						cb.setPlaceholder("Folder")
							.setValue(mapping.folder)
							.onChange(async (newFolder) => {
								this.plugin.settings.addNewNoteFolders[
									index
								].folder = newFolder.trim();
								await this.plugin.saveSettings();
							});
						cb.inputEl.onblur = () => {
							this.validate();
						};
					})
					.addSearch((cb) => {
						new FileSuggest(this.app, cb.inputEl);
						cb.setPlaceholder("No template (blank)")
							.setValue(mapping.template || "")
							.onChange(async (newFile) => {
								this.plugin.settings.addNewNoteFolders[
									index
								].template = newFile.trim();
								await this.plugin.saveSettings();
							});
						cb.inputEl.onblur = () => {
							this.validate();
						};
					})
					.addExtraButton((cb) => {
						cb.setIcon("cross")
							.setTooltip("Delete")
							.onClick(async () => {
								this.plugin.settings.addNewNoteFolders.splice(
									index,
									1
								);
								await this.plugin.saveSettings();
								this.display();
							});
					});
				newFolderSetting.controlEl.addClass(
					"at-symbol-linking-folder-setting"
				);
				newFolderSetting.infoEl.remove();
			});
			// End add new notes for folders by symbol
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
			`When symbol linking, you might want to type a full name e.g. "Brandon Sanderson" without the popup closing.`,
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

		// Begin allowedCodeBlockTypes option
		const allowedCodeBlockTypesDesc = document.createDocumentFragment();
		allowedCodeBlockTypesDesc.append(
			`By default, symbol linking is disabled inside code blocks.`,
			allowedCodeBlockTypesDesc.createEl("br"),
			"Add code block types here to allow linking within those specific code blocks.",
			allowedCodeBlockTypesDesc.createEl("br"),
			allowedCodeBlockTypesDesc.createEl("em", {
				text: "Example: 'ad-note' will allow linking inside ```ad-note code blocks.",
			})
		);

		new Setting(this.containerEl)
			.setName("Allowed code block types")
			.setDesc(allowedCodeBlockTypesDesc)
			.addButton((button: ButtonComponent): ButtonComponent => {
				return button
					.setTooltip("Add code block type")
					.setButtonText("+")
					.setCta()
					.onClick(async () => {
						this.plugin.settings.allowedCodeBlockTypes.push("");
						await this.plugin.saveSettings();
						this.display();
					});
			});

		// Create individual settings for each code block type
		this.plugin.settings.allowedCodeBlockTypes.forEach((type, index) => {
			new Setting(this.containerEl)
				.setName(`Code block type ${index + 1}`)
				.addText((text) => {
					text.setPlaceholder("ad-note")
						.setValue(type)
						.onChange(async (value) => {
							this.plugin.settings.allowedCodeBlockTypes[index] =
								value;
							await this.plugin.saveSettings();
						});
				})
				.addExtraButton((button) => {
					button
						.setIcon("up-chevron-glyph")
						.setTooltip("Move up")
						.onClick(async () => {
							arrayMove(
								this.plugin.settings.allowedCodeBlockTypes,
								index,
								index - 1
							);
							await this.plugin.saveSettings();
							this.display();
						});
				})
				.addExtraButton((button) => {
					button
						.setIcon("down-chevron-glyph")
						.setTooltip("Move down")
						.onClick(async () => {
							arrayMove(
								this.plugin.settings.allowedCodeBlockTypes,
								index,
								index + 1
							);
							await this.plugin.saveSettings();
							this.display();
						});
				})
				.addExtraButton((button) => {
					button
						.setIcon("cross")
						.setTooltip("Delete")
						.onClick(async () => {
							this.plugin.settings.allowedCodeBlockTypes.splice(
								index,
								1
							);
							await this.plugin.saveSettings();
							this.display();
						});
				});
		});
		// End allowedCodeBlockTypes option

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

		// globalTriggerSymbol should be a single character
		if (settings.globalTriggerSymbol.length !== 1) {
			new Notice(`Global trigger symbol must be a single character.`);
			await updateSetting(
				"globalTriggerSymbol",
				settings.globalTriggerSymbol.length
					? settings.globalTriggerSymbol[0]
					: "@"
			);
		}

		// Folders should exist
		for (let i = 0; i < settings.limitLinkDirectories.length; i++) {
			const mapping = settings.limitLinkDirectories[i];
			if (mapping.folder === "") {
				continue;
			}
			const folderFile = this.app.vault.getAbstractFileByPath(
				mapping.folder
			);
			if (!folderFile) {
				new Notice(
					`Unable to find folder at path: ${mapping.folder}. Please add it if you want to limit links to this folder.`
				);
				const newFolders = [...settings.limitLinkDirectories];
				newFolders[i] = { folder: "", symbol: "" };
				await updateSetting("limitLinkDirectories", newFolders);
			}
		}

		// Folder-specific symbols should be single characters
		for (let i = 0; i < settings.limitLinkDirectories.length; i++) {
			const mapping = settings.limitLinkDirectories[i];
			// Make sure symbol isn't part of invalid character regex (if there is invalid char regex)
			if (mapping.symbol && settings.invalidCharacterRegex) {
				try {
					const invalidRegex = new RegExp(
						settings.invalidCharacterRegex,
						settings.invalidCharacterRegexFlags
					);
					if (invalidRegex.test(mapping.symbol)) {
						new Notice(
							`Folder symbol "${mapping.symbol}" matches invalid character regex and will not work properly.`
						);
						const newFolders = [...settings.limitLinkDirectories];
						newFolders[i] = { ...mapping, symbol: "" };
						await updateSetting("limitLinkDirectories", newFolders);
						continue;
					}
				} catch (e) {
					// Regex validation happens elsewhere
				}
			}

			if (mapping.symbol && mapping.symbol.length > 1) {
				new Notice(
					`Folder symbol must be a single character or empty.`
				);
				const newFolders = [...settings.limitLinkDirectories];
				newFolders[i] = { ...mapping, symbol: mapping.symbol[0] };
				await updateSetting("limitLinkDirectories", newFolders);
			}
		}

		// Validate new note folders when add new note option is enabled
		if (settings.showAddNewNote) {
			// Track which symbols we've seen to keep only the first occurrence
			const seenSymbols = new Set<string>();
			
			for (let i = 0; i < settings.addNewNoteFolders.length; i++) {
				const mapping = settings.addNewNoteFolders[i];

				// Symbol must be a single character
				if (mapping.symbol && mapping.symbol.length > 1) {
					new Notice(
						`New note folder symbol must be a single character.`
					);
					const newFolders = [...settings.addNewNoteFolders];
					newFolders[i] = { ...mapping, symbol: mapping.symbol[0] };
					await updateSetting("addNewNoteFolders", newFolders);
					continue;
				}

				// Symbol must be unique - clear duplicates after the first occurrence
				if (mapping.symbol) {
					if (seenSymbols.has(mapping.symbol)) {
						new Notice(
							`New note folder symbol "${mapping.symbol}" must be unique. Clearing duplicate occurrence.`
						);
						const newFolders = [...settings.addNewNoteFolders];
						newFolders[i] = { ...mapping, symbol: "" };
						await updateSetting("addNewNoteFolders", newFolders);
						continue;
					}
					seenSymbols.add(mapping.symbol);
				}

				// Make sure symbol isn't part of invalid character regex
				if (mapping.symbol && settings.invalidCharacterRegex) {
					try {
						const invalidRegex = new RegExp(
							settings.invalidCharacterRegex,
							settings.invalidCharacterRegexFlags
						);
						if (invalidRegex.test(mapping.symbol)) {
							new Notice(
								`New note folder symbol "${mapping.symbol}" matches invalid character regex and will not work properly.`
							);
							const newFolders = [...settings.addNewNoteFolders];
							newFolders[i] = { ...mapping, symbol: "" };
							await updateSetting("addNewNoteFolders", newFolders);
							continue;
						}
					} catch (e) {
						// Regex validation happens elsewhere
					}
				}

				// Folder should exist
				if (mapping.folder) {
					const folderFile = this.app.vault.getAbstractFileByPath(
						mapping.folder
					);
					if (!folderFile) {
						new Notice(
							`Unable to find folder at path: ${mapping.folder}. Please add it if you want to create new notes in this folder.`
						);
						const newFolders = [...settings.addNewNoteFolders];
						newFolders[i] = { ...mapping, folder: "" };
						await updateSetting("addNewNoteFolders", newFolders);
						continue;
					}
				}

				// Template file should exist
				if (mapping.template) {
					const templateFile = this.app.vault.getAbstractFileByPath(
						`${mapping.template}.md`
					);
					if (!templateFile) {
						new Notice(
							`Unable to find template file at path: ${mapping.template}.md`
						);
						const newFolders = [...settings.addNewNoteFolders];
						newFolders[i] = { ...mapping, template: "" };
						await updateSetting("addNewNoteFolders", newFolders);
						continue;
					}
				}
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
