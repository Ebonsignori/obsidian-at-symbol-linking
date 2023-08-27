import {
	App,
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	TFile,
	setIcon,
} from "obsidian";
import fuzzysort from "fuzzysort";
import { AtSymbolLinkingSettings } from "src/settings/settings";
import { highlightSearch } from "./utils";

type fileOption = {
	fileName: string;
	filePath: string;
	alias?: string;
};

export default class SuggestionPopup extends EditorSuggest<
	Fuzzysort.KeysResult<fileOption>
> {
	private readonly settings: AtSymbolLinkingSettings;

	private firstOpenedCursor: null | EditorPosition = null;
	private focused = false;
	private app: App;

	constructor(app: App, settings: AtSymbolLinkingSettings) {
		super(app);
		this.app = app;
		this.settings = settings;

		//Remove default key registrations
		const self = this as any;
		self.scope.keys = [];
	}

	open() {
		super.open();
		this.focused = true;
	}

	close() {
		super.close();
		this.focused = false;
	}

	getSuggestions(
		context: EditorSuggestContext
	): Fuzzysort.KeysResult<fileOption>[] {
		const options: fileOption[] = [];
		for (const file of context.file.vault.getMarkdownFiles()) {
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
		let results;
		if (!context.query) {
			results = options
				.map((option) => ({
					obj: option,
				}))
				// Reverse because filesystem is sorted alphabetically
				.reverse();
		} else {
			// Fuzzy search files based on query
			results = fuzzysort.go(context.query, options, {
				keys: ["alias", "fileName"],
			}) as any;
		}

		return results;
	}

	onTrigger(
		cursor: EditorPosition,
		editor: Editor
	): EditorSuggestTriggerInfo | null {
		let query = "";
		const typedChar = editor.getRange(
			{ ...cursor, ch: cursor.ch - 1 },
			{ ...cursor, ch: cursor.ch }
		);

		// When open and user enters space, or newline, or tab, close
		if (
			this.firstOpenedCursor &&
			(typedChar === " " || typedChar === "\n" || typedChar === "\t")
		) {
			return this.closeSuggestion();
		}

		// TODO: If user's cursor is inside a code block, don't attempt to link
		// Is there an easy way to get state of cursor? Or do I have to parse the text?

		// Open suggestion when @ is typed
		if (typedChar === "@") {
			this.firstOpenedCursor = cursor;
			return {
				start: { ...cursor, ch: cursor.ch - 1 },
				end: cursor,
				query,
			};
		}

		// Don't continue evaluating if not opened
		if (!this.firstOpenedCursor) {
			return null;
		} else {
			query = editor.getRange(this.firstOpenedCursor, {
				...cursor,
				ch: cursor.ch + 1,
			});
		}

		// If query is empty or doesn't have valid filename characters, close
		if (
			!query ||
			!/[a-z0-9\\$\\-\\_\\!\\%\\"\\'\\.\\,\\*\\&\\(\\)\\;\\{\\}\\+\\=\\~\\`\\?)]/i.test(
				query
			)
		) {
			return this.closeSuggestion();
		}

		return {
			start: { ...cursor, ch: cursor.ch - 1 },
			end: cursor,
			query,
		};
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

	selectSuggestion(value: Fuzzysort.KeysResult<fileOption>): void {
		const line =
			this.context?.editor.getRange(
				{
					line: this.context.start.line,
					ch: 0,
				},
				this.context.end
			) || "";

		const currentFile = this.app.workspace.getActiveFile();
		const linkFile = this.app.vault.getAbstractFileByPath(
			value.obj?.filePath
		) as TFile;
		let alias = value.obj?.alias || undefined;
		if (this.settings.includeSymbol) alias = `@${alias || value.obj?.fileName}`;
		let linkText = this.app.fileManager.generateMarkdownLink(
			linkFile,
			currentFile?.path || "",
			undefined, // we don't care about the subpath
			alias
		);

		this.context?.editor.replaceRange(
			linkText,
			{ line: this.context.start.line, ch: line.lastIndexOf("@") },
			this.context.end
		);
	}

	selectNextItem(dir: SelectionDirection) {
		if (!this.focused) {
			this.focused = true;
			dir =
				dir === SelectionDirection.PREVIOUS
					? dir
					: SelectionDirection.NONE;
		}

		const self = this as any;
		// HACK: The second parameter has to be an instance of KeyboardEvent to force scrolling the selected item into
		// view
		self.suggestions.setSelectedItem(
			self.suggestions.selectedItem + dir,
			new KeyboardEvent("keydown")
		);
	}

	closeSuggestion() {
		this.firstOpenedCursor = null;
		this.close();
		return null;
	}

	getSelectedItem(): Fuzzysort.KeysResult<fileOption> {
		const self = this as any;
		return self.suggestions.values[self.suggestions.selectedItem];
	}

	applySelectedItem() {
		const self = this as any;
		self.suggestions.useSelectedItem();
	}

	isVisible(): boolean {
		return (this as any).isOpen;
	}

	isFocused(): boolean {
		return this.focused;
	}
}

export enum SelectionDirection {
	NEXT = 1,
	PREVIOUS = -1,
	NONE = 0,
}
