// Code derived from https://github.com/farux/obsidian-auto-note-mover
import { App, Platform, Scope } from "obsidian";
import { createPopper, Instance as PopperInstance } from "@popperjs/core";
import type { ISuggestOwner as IOwner } from "obsidian";
import { AtSymbolLinkingSettings } from "src/settings/settings";
import { fileOption } from "src/types";
import { sharedSelectSuggestion } from "src/shared-suggestion/sharedSelectSuggestion";
import sharedRenderSuggestion from "src/shared-suggestion/sharedRenderSuggestion";
import { sharedGetSuggestions } from "src/shared-suggestion/sharedGetSuggestions";

export class Suggest<T> {
	private owner: IOwner<T>;
	private values: T[];
	private suggestions: HTMLDivElement[];
	private selectedItem: number;
	private containerEl: HTMLElement;

	constructor(owner: IOwner<T>, containerEl: HTMLElement, scope: Scope) {
		this.owner = owner;
		this.containerEl = containerEl;

		containerEl.on(
			"click",
			".suggestion-item",
			this.onSuggestionClick.bind(this)
		);
		containerEl.on(
			"mousemove",
			".suggestion-item",
			this.onSuggestionMouseover.bind(this)
		);

		scope.register([], "ArrowUp", (event) => {
			if (!event.isComposing) {
				this.setSelectedItem(this.selectedItem - 1, true);
				return false;
			}
		});

		scope.register([], "ArrowDown", (event) => {
			if (!event.isComposing) {
				this.setSelectedItem(this.selectedItem + 1, true);
				return false;
			}
		});

		scope.register([], "Enter", (event) => {
			if (!event.isComposing) {
				this.useSelectedItem(event);
				return false;
			}
		});
	}

	onSuggestionClick(event: MouseEvent, el: HTMLDivElement): void {
		event.preventDefault();

		const item = this.suggestions.indexOf(el);
		this.setSelectedItem(item, false);
		this.useSelectedItem(event);
	}

	onSuggestionMouseover(_event: MouseEvent, el: HTMLDivElement): void {
		const item = this.suggestions.indexOf(el);
		this.setSelectedItem(item, false);
	}

	setSuggestions(values: T[]) {
		this.containerEl.empty();
		const suggestionEls: HTMLDivElement[] = [];

		values.forEach((value) => {
			const suggestionEl = this.containerEl.createDiv("suggestion-item");
			this.owner.renderSuggestion(value, suggestionEl);
			suggestionEls.push(suggestionEl);
		});

		this.values = values;
		this.suggestions = suggestionEls;
		this.setSelectedItem(0, false);
	}

	useSelectedItem(event: MouseEvent | KeyboardEvent) {
		const currentValue = this.values[this.selectedItem];
		if (currentValue) {
			this.owner.selectSuggestion(currentValue, event);
		}
	}

	setSelectedItem(selectedIndex: number, scrollIntoView: boolean) {
		const normalizedIndex = wrapAround(
			selectedIndex,
			this.suggestions.length
		);
		const prevSelectedSuggestion = this.suggestions[this.selectedItem];
		const selectedSuggestion = this.suggestions[normalizedIndex];

		prevSelectedSuggestion?.removeClass("is-selected");
		selectedSuggestion?.addClass("is-selected");

		this.selectedItem = normalizedIndex;

		if (scrollIntoView) {
			selectedSuggestion.scrollIntoView(false);
		}
	}
}

export class LinkSuggest implements IOwner<Fuzzysort.KeysResult<fileOption>> {
	protected app: App;
	protected inputEl: HTMLDivElement;
	protected settings: AtSymbolLinkingSettings;

	private popper: PopperInstance;
	private scope: Scope;
	private suggestEl: HTMLElement;
	private suggest: Suggest<Fuzzysort.KeysResult<fileOption>>;
	private onSelect: (linkText: string) => void;

	constructor(
		app: App,
		inputEl: HTMLDivElement,
		settings: AtSymbolLinkingSettings,
		onSelect: (linkText: string) => void
	) {
		this.app = app;
		this.inputEl = inputEl;
		this.settings = settings;
		this.scope = new Scope();
		this.onSelect = onSelect;

		this.suggestEl = createDiv("suggestion-container");
		if (Platform.isMobile) {
			this.suggestEl.style.padding = "0";
		} else {
			this.suggestEl.addClass("extension-container-at-symbol-linking");
		}
		this.suggestEl.style.zIndex = "1000";
		const suggestion = this.suggestEl.createDiv("suggestion");
		suggestion.id = "at-symbol-suggestion-container";
		this.suggest = new Suggest(this, suggestion, this.scope);

		this.scope.register([], "Escape", this.close.bind(this));

		this.inputEl.addEventListener("focus", this.onInputChanged.bind(this));
		this.inputEl.addEventListener("blur", this.close.bind(this));
		this.suggestEl.on(
			"mousedown",
			".suggestion-container",
			(event: MouseEvent) => {
				event.preventDefault();
			}
		);
	}

	onInputChanged(inputStr: string): void {
		const suggestions = this.getSuggestions(inputStr);

		if (suggestions.length > 0) {
			this.suggest.setSuggestions(suggestions);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			this.open((<any>this.app).dom.appContainerEl, this.inputEl);
		}
	}

	open(container: HTMLElement, inputEl: HTMLElement): void {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(<any>this.app).keymap.pushScope(this.scope);

		container.appendChild(this.suggestEl);
		this.popper = createPopper(inputEl, this.suggestEl, {
			placement: Platform.isMobile ? "top" : "bottom-start",
			modifiers: [
				{
					name: "flip",
					options: {
						flipVariations: false,
						fallbackPlacements: [
							Platform.isMobile ? "top" : "right",
						],
					},
				},
				{
					name: "sameWidth",
					enabled: true,
					fn: ({ state, instance }) => {
						// Note: positioning needs to be calculated twice -
						// first pass - positioning it according to the width of the popper
						// second pass - position it with the width bound to the reference element
						// we need to early exit to avoid an infinite loop
						const targetWidth = Platform.isMobile
							? "100vw"
							: `${state.rects.reference.width}px`;
						if (state.styles.popper.width === targetWidth) {
							return;
						}
						state.styles.popper.width = targetWidth;
						instance.update();
					},
					phase: "beforeWrite",
					requires: ["computeStyles"],
				},
			],
		});
	}

	close(): void {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(<any>this.app).keymap.popScope(this.scope);

		this.suggest.setSuggestions([]);
		this.popper?.destroy();
		this.suggestEl.detach();
		this.inputEl.removeEventListener(
			"focus",
			this.onInputChanged.bind(this)
		);
		this.inputEl.removeEventListener("blur", this.close.bind(this));
	}

	getSuggestions(query: string): Fuzzysort.KeysResult<fileOption>[] {
		const files = this.app.vault.getMarkdownFiles();
		return sharedGetSuggestions(files, query, this.settings);
	}

	renderSuggestion(
		value: Fuzzysort.KeysResult<fileOption>,
		el: HTMLElement
	): void {
		sharedRenderSuggestion(value, el);
	}

	async selectSuggestion(
		value: Fuzzysort.KeysResult<fileOption>
	): Promise<void> {
		const linkText = await sharedSelectSuggestion(
			this.app,
			this.settings,
			value
		);

		this.onSelect(linkText);
	}
}

export const wrapAround = (value: number, size: number): number => {
	return ((value % size) + size) % size;
};
