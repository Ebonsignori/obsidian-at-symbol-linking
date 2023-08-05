import {
	App,
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
} from "obsidian";
import fuzzysort from "fuzzysort";
import { AtSymbolLinkingSettings, LinkType } from "src/settings/settings";

type fileOption = {
	fileName: string;
	filePath: string;
	alias?: string;
};

type fileOptionResult = {
	0: { target: string; indexes: number[]; score: number };
	1: { target: string; indexes: number[]; score: number };
	obj: fileOption;
};

let isOpen = false;

export default class SuggestionPopup extends EditorSuggest<fileOptionResult> {
	private readonly settings: AtSymbolLinkingSettings;

	private focused = false;

	constructor(app: App, settings: AtSymbolLinkingSettings) {
		super(app);
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

	getSuggestions(context: EditorSuggestContext): fileOptionResult[] {
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
			} else {
				options.push({
					fileName: file.basename,
					filePath: file.path,
				});
			}
		}

		const results = fuzzysort.go(context.query, options, {
			keys: ["alias", "fileName"],
		}) as unknown as fileOptionResult[];

		return results;
	}

	onTrigger(
		cursor: EditorPosition,
		editor: Editor
	): EditorSuggestTriggerInfo | null {
		const typedChar = editor.getRange(
			{ ...cursor, ch: cursor.ch - 1 },
			{ ...cursor, ch: cursor.ch }
		);
		if (typedChar === " ") {
			isOpen = false;
			return null;
		}

		// Trigger when @ is typed
		if (isOpen || typedChar === "@") {
			isOpen = true;

			const line = editor.getRange(
				{ ...cursor, ch: 0 },
				{ ...cursor, ch: cursor.ch + 1 }
			);
			const query = line.substring(line.lastIndexOf("@") + 1);

			return {
				start: { ...cursor, ch: cursor.ch - 1 },
				end: cursor,
				query,
			};
		}

		return null;
	}

	renderSuggestion(value: fileOptionResult, el: HTMLElement): void {
		const alias = value[0]
			? fuzzysort.highlight(value[0])
			: value.obj?.alias;
		const fileName = value[1]
			? fuzzysort.highlight(value[1])
			: value.obj?.fileName;
		el.addClass("at-symbol-linking-suggestion");

		const container = el.doc.createElement("div");
		const title = el.doc.createElement("div");
		title.addClass("suggestion-title");
		title.innerHTML = alias || fileName || "";
		const path = el.doc.createElement("div");
		path.addClass("suggestion-path");
		path.setText(value.obj?.filePath);

		container.appendChild(title);
		container.appendChild(path);

		el.appendChild(container);
	}

	selectSuggestion(value: fileOptionResult): void {
		const line =
			this.context?.editor.getRange(
				{
					line: this.context.start.line,
					ch: 0,
				},
				this.context.end
			) || "";
		let linkText = "";
		if (this.settings.linkType === LinkType.OBSIDIAN_STYLE) {
			linkText = `[[${value.obj?.filePath}|${
				this.settings.includeSymbol ? "@" : ""
			}${value.obj?.alias || value.obj?.fileName}]]`;
		} else if (this.settings.linkType === LinkType.MARKDOWN_STYLE) {
			linkText = `[${this.settings.includeSymbol ? "@" : ""}${
				value.obj?.alias || value.obj?.fileName
			}](<${value.obj?.filePath}>)`;
		}

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

	getSelectedItem(): fileOptionResult {
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
