// Code derived from https://github.com/farux/obsidian-auto-note-mover
import { App, Notice, Platform, Scope, setIcon } from "obsidian";
import { createPopper, Instance as PopperInstance } from "@popperjs/core";
import type { ISuggestOwner as IOwner, TFile } from "obsidian";
import { AtSymbolLinkingSettings } from "src/settings/settings";
import { fileOption } from "src/types";
import { highlightSearch } from "src/utils/highlight-search";
import fuzzysort from "fuzzysort";

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
		const suggestion = this.suggestEl.createDiv("suggestion");
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
		const options: fileOption[] = [];
		for (const file of this.app.vault.getMarkdownFiles()) {
			// If there are folders to limit links to, check if the file is in one of them
			if (this.settings.limitLinkDirectories.length > 0) {
				let isAllowed = false;
				for (const folder of this.settings.limitLinkDirectories) {
					if (file.path.startsWith(folder)) {
						isAllowed = true;
						break;
					}
				}
				if (!isAllowed) {
					continue;
				}
			}
			const meta = app.metadataCache.getFileCache(file);
			if (meta?.frontmatter?.alias) {
				options.push({
					fileName: file.basename,
					filePath: file.path,
					alias: meta.frontmatter.alias,
				});
			} else if (meta?.frontmatter?.aliases) {
				let aliases = meta.frontmatter.aliases;
				if (typeof meta.frontmatter.aliases === "string") {
					aliases = meta.frontmatter.aliases
						.split(",")
						.map((s) => s.trim());
				}
				for (const alias of aliases) {
					options.push({
						fileName: file.basename,
						filePath: file.path,
						alias: alias,
					});
				}
			}
			// Include fileName without alias as well
			options.push({
				fileName: file.basename,
				filePath: file.path,
			});
		}

		// Show all files when no query
		let results = [];
		if (!query) {
			results = options
				.map((option) => ({
					obj: option,
				}))
				// Reverse because filesystem is sorted alphabetically
				.reverse();
		} else {
			// Fuzzy search files based on query
			results = fuzzysort.go(query, options, {
				keys: ["alias", "fileName"],
			}) as any;
		}

		// If showAddNewNote option is enabled, show it as the last option
		if (this.settings.showAddNewNote && query) {
			// Don't show if it has the same filename as an existing note
			const hasExistingNote = results.some(
				(result: Fuzzysort.KeysResult<fileOption>) =>
					result?.obj?.fileName.toLowerCase() === query?.toLowerCase()
			);
			if (!hasExistingNote) {
				results = results.filter(
					(result: Fuzzysort.KeysResult<fileOption>) =>
						!result.obj?.isCreateNewOption
				);
				const separator = this.settings.addNewNoteDirectory ? "/" : "";
				results.push({
					obj: {
						isCreateNewOption: true,
						query: query,
						fileName: "Create new note",
						filePath: `${this.settings.addNewNoteDirectory.trim()}${separator}${query.trim()}.md`,
					},
				});
			}
		}

		return results;
	}

	renderSuggestion(
		value: Fuzzysort.KeysResult<fileOption>,
		el: HTMLElement
	): void {
		el.addClass("at-symbol-linking-suggestion");
		const context = el.doc.createElement("div");
		context.addClass("suggestion-context");

		// Add title with matching search terms bolded (highlighted)
		const title = el.doc.createElement("div");
		title.addClass("suggestion-title");
		if (value[0]) {
			highlightSearch(title, value[0]);
		} else if (value.obj?.alias) {
			title.setText(value.obj?.alias);
		} else if (value[1]) {
			highlightSearch(title, value[1]);
		} else if (value.obj?.fileName) {
			title.setText(value.obj?.fileName);
		} else {
			title.setText("");
		}

		const path = el.doc.createElement("div");
		path.addClass("suggestion-path");
		path.setText(value.obj?.filePath?.slice(0, -3));

		context.appendChild(title);
		context.appendChild(path);

		const aux = el.doc.createElement("div");
		aux.addClass("suggestion-aux");

		if (value?.obj?.alias) {
			const alias = el.doc.createElement("span");
			alias.addClass("suggestion-flair");
			alias.ariaLabel = "Alias";
			setIcon(alias, "forward");
			aux.appendChild(alias);
		}

		el.appendChild(context);
		el.appendChild(aux);
	}

	async selectSuggestion(
		value: Fuzzysort.KeysResult<fileOption>
	): Promise<void> {
		// When user selects "Create new note" option, create the note to link to
		let linkFile;
		if (value?.obj?.isCreateNewOption) {
			let newNoteContents = "";
			if (this.settings.addNewNoteTemplateFile) {
				const fileTemplate = this.app.vault.getAbstractFileByPath(
					`${this.settings.addNewNoteTemplateFile}.md`
				) as TFile;
				newNoteContents =
					(await this.app.vault.read(fileTemplate)) || "";
			}

			try {
				linkFile = await this.app.vault.create(
					value.obj?.filePath,
					newNoteContents
				);
				// Update the alias to the name for displaying the @ link
				value.obj.alias = value.obj?.query;
			} catch (error) {
				new Notice(
					`Unable to create new note at path: ${value.obj?.filePath}. Please open an issue on GitHub, https://github.com/Ebonsignori/obsidian-at-symbol-linking/issues`,
					0
				);
				throw error;
			}
		}

		const currentFile = this.app.workspace.getActiveFile();
		if (!linkFile) {
			linkFile = this.app.vault.getAbstractFileByPath(
				value.obj?.filePath
			) as TFile;
		}
		let alias = value.obj?.alias || value.obj?.fileName;
		if (this.settings.includeSymbol) alias = `@${alias}`;
		let linkText = this.app.fileManager.generateMarkdownLink(
			linkFile,
			currentFile?.path || "",
			undefined, // we don't care about the subpath
			alias
		);

		if (linkText.includes("\n")) {
			linkText = linkText.replace(/\n/g, "");
		}

		this.onSelect(linkText);
	}
}

export const wrapAround = (value: number, size: number): number => {
	return ((value % size) + size) % size;
};
