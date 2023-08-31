import { Plugin, WorkspaceLeaf } from "obsidian";
import type { EditorView } from "@codemirror/view";
import {
	AtSymbolLinkingSettings,
	DEFAULT_SETTINGS,
	SettingsTab,
} from "./settings/settings";
import SuggestionPopup from "./native-version/suggest-popup";
import { applyHotKeyHack } from "./native-version/hotkeys";
import { editorPlugin } from "./extension-version/extension-handler";

const maxParentDepth = 5;

export default class AtSymbolLinking extends Plugin {
	settings: AtSymbolLinkingSettings;
	_suggestionPopup: SuggestionPopup;
	_editorExtension: boolean;
	activeExtension: any;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SettingsTab(this.app, this));

		this.registerPopup();
	}

	registerPopup(): void {
		// If compatibility mode is enabled, use the HTML extension-based popup
		// Otherwise, use the native EditorSuggest popup
		if (this.settings.useCompatibilityMode) {
			if (this._suggestionPopup) {
				// TODO: Find a way to unregister popup without restart
				this._suggestionPopup.close();
				// @ts-expect-error not supposed to set to undefined
				this._suggestionPopup = undefined;
			}
			this._editorExtension = true;
			this.registerEditorExtension(editorPlugin);
			this.giveExtensionProps(this.app.workspace.getMostRecentLeaf());
			this.registerDomEvent(
				window,
				"click",
				this.closeSuggestionListener.bind(this)
			);
			const onLeafChange = async (leaf: WorkspaceLeaf) => {
				this.giveExtensionProps(leaf);
			};
			this.registerEvent(
				this.app.workspace.on(
					"active-leaf-change",
					onLeafChange.bind(this)
				)
			);
		} else {
			// TODO: Find a way to unregister extension without restart
			if (this._editorExtension) {
				try {
					// @ts-expect-error viewRegistry is private
					this.app.viewRegistry.unregisterExtensions([editorPlugin]);
				} catch (error) {
					console.error(error);
				}
			}
			this._suggestionPopup = new SuggestionPopup(
				this.app,
				this.settings
			);
			this.registerEditorSuggest(this._suggestionPopup);
			applyHotKeyHack(this, this.app);
		}
	}

	giveExtensionProps(leaf: WorkspaceLeaf | null): void {
		// @ts-expect-error editor is private
		const activeEditor = leaf?.view?.editor;
		if (activeEditor) {
			const editorView = activeEditor.cm as EditorView;
			const editorPlug = editorView.plugin(editorPlugin);
			if (editorPlug) {
				this.activeExtension = editorPlug;
			}
			editorPlug?.updateProps(this.app, this.settings);
		}
	}

	closeSuggestionListener(event: any): void {
		let currentDepth = 0;
		let parent = event.target;
		let shouldClose = true;
		while (event.target && currentDepth < maxParentDepth) {
			currentDepth++;
			if (parent?.classList.contains("suggestion-context")) {
				shouldClose = false;
				break;
			}
			parent = parent?.parentNode;
		}
		if (shouldClose && this.activeExtension) {
			this.activeExtension.closeSuggestion();
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
