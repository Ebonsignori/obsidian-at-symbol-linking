import { Notice, Plugin } from "obsidian";
import { atSymbolTriggerExtension } from "./compatibility-mode-extension/extension-handler";
import { applyHotKeyHack } from "./native-suggestion/hotkeys";
import SuggestionPopup from "./native-suggestion/suggest-popup";
import {
	type AtSymbolLinkingSettings,
	type CustomSuggester,
	DEFAULT_SETTINGS,
} from "./settings/interface";
import { SettingsTab } from "./settings/settings";
export default class AtSymbolLinking extends Plugin {
	settings: CustomSuggester;
	reloadingPlugins = false;
	activeExtensions: any[];
	_suggestionPopup: SuggestionPopup;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SettingsTab(this.app, this));

		this.registerPopup();
	}

	onunload() {
		console.log("unloading plugin");
	}

	// If compatibility mode is enabled, use the HTML extension-based popup
	// Otherwise, use the native EditorSuggest popup
	registerPopup(): void {
		if (this.settings.useCompatibilityMode) {
			this.activeExtensions = [atSymbolTriggerExtension(this.app, this.settings)];
			this.registerEditorExtension(this.activeExtensions);
			this.registerEvent(
				this.app.workspace.on(
					"active-leaf-change",
					this.updateEditorProcessors.bind(this),
				),
			);
		} else {
			this._suggestionPopup = new SuggestionPopup(this.app, this.settings);
			//@ts-ignore
			this.registerEditorSuggest(this._suggestionPopup);
			applyHotKeyHack(this, this.app);
		}
	}

	// Since we can disable/enable modes that register and unregister an editor extension in settings
	// We need to reload the plugin to unregister the existing extension when settings are changed
	async reloadPlugin(shouldReset: boolean) {
		if (!shouldReset) {
			return;
		}
		if (this.reloadingPlugins) return;
		this.reloadingPlugins = true;

		const plugins = (<any>this.app).plugins;
		if (!plugins?.enabledPlugins?.has(this.manifest.id)) {
			return;
		}

		await plugins.disablePlugin(this.manifest.id);
		try {
			await new Promise((resolve) => setTimeout(resolve, 100));
			await plugins.enablePlugin(this.manifest.id);
		} catch (error) {
			/* empty */
		}

		this.reloadingPlugins = false;
	}

	async convertOldSettings() {
		const oldManifest = this.app.plugins.manifests["at-symbol-linking"];
		if (oldManifest && !this.settings._converted) {
			const folder = oldManifest.dir;
			//get data.json file
			const dataFile = `${folder}/data.json`;
			const settings = await this.app.vault.adapter.read(dataFile);
			const oldSettings = JSON.parse(settings) as Partial<AtSymbolLinkingSettings>;
			if (oldSettings) {
				new Notice("Convertir the settings of @ symbol linking to custom suggester");
				if (oldSettings) {
					const directories = oldSettings?.limitLinkDirectories;
					const files = oldSettings?.limitToOneFile;
					const directoriesTrigger = oldSettings?.limitLinkDirectoriesWithTrigger;
					delete oldSettings.limitToOneFile;
					const filesTrigger = oldSettings?.limitToOneFileWithTrigger;
					delete oldSettings.limitToOneFileWithTrigger;
					delete oldSettings.limitLinkDirectories;
					delete oldSettings.limitToOneFile;
					console.log("oldSettings", directories && directories.length);
					if (directories && directories.length > 0)
						this.settings.limitToDirectories = directories.map((path) => ({
							path,
							triggerSymbol: oldSettings.triggerSymbol ?? "@",
						}));
					else if (directoriesTrigger && directoriesTrigger.length > 0) {
						this.settings.limitToDirectories = directoriesTrigger;
						delete oldSettings.limitLinkDirectoriesWithTrigger;
					}
					if (files && files.length > 0)
						this.settings.limitToFile = files.map((path) => ({
							path,
							triggerSymbol: oldSettings.triggerSymbol ?? "@",
						}));
					else if (filesTrigger && filesTrigger.length > 0) {
						this.settings.limitToFile = filesTrigger;
						delete oldSettings.limitToOneFileWithTrigger;
					}
				}
			}
		}
		this.settings._converted = true;
		await this.saveSettings();
	}

	updateEditorProcessors() {
		if (this.activeExtensions?.length) {
			this.activeExtensions.forEach((extension) => {
				if (typeof extension?.destroy === "function") {
					extension.destroy();
				}
			});
			this.activeExtensions.length = 0;
			this.activeExtensions.push(atSymbolTriggerExtension(this.app, this.settings));
			this.app.workspace.updateOptions();
		}
	}

	async loadSettings() {
		//convert old plugin if exists
		const oldPlugin = this.app.plugins.plugins["at-symbol-linking"];
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		await this.convertOldSettings();
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
