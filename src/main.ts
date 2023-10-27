import { Plugin } from "obsidian";
import {
	AtSymbolLinkingSettings,
	DEFAULT_SETTINGS,
	SettingsTab,
} from "./settings/settings";
import SuggestionPopup from "./native-suggestion/suggest-popup";
import { applyHotKeyHack } from "./native-suggestion/hotkeys";
import { atSymbolTriggerExtension } from "./compatibility-mode-extension/extension-handler";

export default class AtSymbolLinking extends Plugin {
	settings: AtSymbolLinkingSettings;
	reloadingPlugins = false;
	activeExtensions: any[];
	_suggestionPopup: SuggestionPopup;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SettingsTab(this.app, this));

		this.registerPopup();
	}

	// If compatibility mode is enabled, use the HTML extension-based popup
	// Otherwise, use the native EditorSuggest popup
	registerPopup(): void {
		if (this.settings.useCompatibilityMode) {
			this.activeExtensions = [
				atSymbolTriggerExtension(this.app, this.settings),
			];
			this.registerEditorExtension(this.activeExtensions);
			this.registerEvent(
				this.app.workspace.on(
					"active-leaf-change",
					this.updateEditorProcessors.bind(this)
				)
			);
		} else {
			this._suggestionPopup = new SuggestionPopup(
				this.app,
				this.settings
			);
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

	updateEditorProcessors() {
		if (this.activeExtensions?.length) {
			this.activeExtensions.forEach((extension) => {
				if (typeof extension?.destroy === "function") {
					extension.destroy();
				}
			});
			this.activeExtensions.length = 0;
			this.activeExtensions.push(
				atSymbolTriggerExtension(this.app, this.settings)
			);
			this.app.workspace.updateOptions();
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
