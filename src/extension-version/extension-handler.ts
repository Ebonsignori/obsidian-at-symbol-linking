import { syntaxTree } from "@codemirror/language";
import { ViewPlugin } from "@codemirror/view";
import type { PluginValue, EditorView, Rect } from "@codemirror/view";
import { Platform, type App, type EditorPosition } from "obsidian";
import { AtSymbolLinkingSettings } from "src/settings/settings";
import { LinkSuggest } from "./extension-popup";

class AtSymbolTriggerExtension implements PluginValue {
	private readonly view: EditorView;
	private app: App;
	private settings: AtSymbolLinkingSettings;

	private firstOpenedCursor: EditorPosition | null = null;
	private openQuery = "";
	private isOpen = false;
	private suggestionEl: HTMLDivElement | null = null;
	private suggestionPopup: LinkSuggest | null = null;

	constructor(view: EditorView) {
		this.view = view;
		this.handleKeyEvent = this.handleKeyEvent.bind(this);
		this.handleClickEvent = this.handleClickEvent.bind(this);
		this.view.dom.addEventListener("keydown", this.handleKeyEvent);
		this.view.dom.addEventListener("click", this.handleClickEvent);
	}

	public updateProps(app: App, settings: AtSymbolLinkingSettings): any {
		this.app = app;
		this.settings = settings;
	}

	public destroy(): void {
		this.view.dom.removeEventListener("keydown", this.handleKeyEvent);
		this.view.dom.removeEventListener("click", this.handleClickEvent);
	}

	public closeSuggestion(): boolean {
		this.isOpen = false;
		this.firstOpenedCursor = null;
		this.openQuery = "";
		this.suggestionPopup?.close();
		this.suggestionEl?.remove();
		this.suggestionPopup = null;
		this.suggestionEl = null;
		return true;
	}

	private openSuggestion(): boolean {
		this.isOpen = true;
		this.firstOpenedCursor = this.getCursor();
		return true;
	}

	private handleKeyEvent(event: KeyboardEvent): boolean {
		// Don't enable when editing title
		let isInTitle = false;
		(<DOMTokenList>(<HTMLElement>event.target)?.classList || []).forEach(
			(className: string) => {
				isInTitle = isInTitle || className === "inline-title";
			}
		);
		if (isInTitle) {
			return false;
		}

		const typedChar = event.key;

		// When open and user enters newline or tab, close
		if (this.isOpen && (typedChar === "\n" || typedChar === "\t")) {
			return this.closeSuggestion();
		}

		let isInValidContext = true;
		const cursor = (<any>this.view)?.viewState.state?.selection?.main as {
			from: number;
			to: number;
		};
		syntaxTree((<any>this.view)?.viewState?.state).iterate({
			from: cursor.from,
			to: cursor.to,
			enter(node) {
				// When node.type name is:
				// hmd-frontmatter - Cursor is in Title (don't open)
				// inline-code - Cursor is in code block (don't open)
				// .includes("codeblock") - Cursor is in multiline code block (don't open)
				// Otherwise, open
				if (
					node.type.name === "hmd-frontmatter" ||
					node.type.name === "inline-code" ||
					node.type.name?.includes("codeblock")
				) {
					isInValidContext = false;
				}
			},
		});

		if (!isInValidContext) {
			return false;
		}

		if (!this.isOpen && typedChar === "@") {
			return this.openSuggestion();
		} else if (!this.isOpen) {
			return false;
		}

		// Build query when open
		const code = event.code.toLowerCase();
		if (typedChar === "Backspace") {
			if (this.openQuery.length === 0) {
				return this.closeSuggestion();
			}
			this.openQuery = this.openQuery.slice(0, -1);
		} else if (typedChar === "Escape") {
			this.closeSuggestion();
		} else if (
			code.includes("key") ||
			code.includes("digit") ||
			code == "space"
		) {
			this.openQuery += typedChar;
		} else {
			return false;
		}

		// If query has more spaces alloted by the leavePopupOpenForXSpaces setting, close
		if (
			this.openQuery.split(" ").length - 1 >
			this.settings.leavePopupOpenForXSpaces
		) {
			return this.closeSuggestion();
		}

		if (!this.suggestionEl && this.firstOpenedCursor && this.view) {
			const container = (<any>this.app).dom.appContainerEl as HTMLElement;
			this.suggestionEl = createDiv();
			this.suggestionEl.style.position = "absolute";
			this.suggestionEl.style.zIndex = "1000";
			this.suggestionEl.id = "at-symbol-suggestion";
			this.suggestionEl.style.width = "0px";
			this.suggestionEl.style.height = "0px";

			if (Platform.isDesktop) {
				const { left: leftOffset, top: topOffset } =
					this.view.coordsAtPos(
						(<EditorPosition>this.firstOpenedCursor)?.ch
					) as Rect;

				this.suggestionEl.style.left = leftOffset + "px";
				// const currentLineElement =
				// 	container.getElementsByClassName("cm-active cm-line")?.[0];
				// const lineElementHeight =
				// 	currentLineElement?.getBoundingClientRect()?.height || 24;
				const lineElementHeight = 24;
				this.suggestionEl.style.top =
					topOffset + lineElementHeight + "px";
			} else {
				this.suggestionEl.style.bottom = "0px";
				this.suggestionEl.style.left = "0px";
			}

			container.appendChild(this.suggestionEl);

			this.suggestionPopup = new LinkSuggest(
				this.app,
				this.suggestionEl,
				this.settings,
				this.onSelect.bind(this)
			);
			this.suggestionPopup.onInputChanged(this.openQuery);
		}

		if (this.suggestionPopup) {
			this.suggestionPopup.onInputChanged(this.openQuery);
		}

		return true;
	}

	handleClickEvent() {
		this.closeSuggestion();
	}

	private onSelect(linkText: string) {
		const cursor = this.getCursor();
		this.view.dispatch(
			this.view.state.update({
				changes: {
					from: this.firstOpenedCursor?.ch as number,
					to: cursor.ch,
					insert: linkText,
				},
			})
		);
		this.closeSuggestion();
	}

	private getCursor(): EditorPosition {
		const ch = this.view.state.selection.ranges[0].head;
		const line = this.view.state.doc.lineAt(ch).number;
		return {
			ch,
			line,
		};
	}
}

export const editorPlugin = ViewPlugin.fromClass(AtSymbolTriggerExtension);
