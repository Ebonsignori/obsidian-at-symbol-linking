import { Plugin } from "obsidian";
import {
	AtSymbolLinkingSettings,
	DEFAULT_SETTINGS,
	SettingsTab,
} from "./settings/settings";
import SuggestionPopup from "./popup";
import { applyHotKeyHack } from "./hotkeys";

export default class AtSymbolLinking extends Plugin {
	settings: AtSymbolLinkingSettings;
	_suggestionPopup: SuggestionPopup;

	async onload() {
		await this.loadSettings();

		this._suggestionPopup = new SuggestionPopup(this.app, this.settings);
		this.registerEditorSuggest(this._suggestionPopup);

		this.addSettingTab(new SettingsTab(this.app, this));

		applyHotKeyHack(this, this.app);
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
