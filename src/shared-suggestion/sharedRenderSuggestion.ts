import { setIcon } from "obsidian";
import type { FileOption } from "src/types";
import { highlightSearch } from "src/utils/highlight-search";

export default function sharedRenderSuggestion(
	value: Fuzzysort.KeysResult<FileOption>,
	el: HTMLElement,
	limitToOneFile: number = 0,
	uniformize?: boolean,
): void {
	el.addClass("at-symbol-linking-suggestion");
	const context = el.doc.createElement("div");
	context.addClass("suggestion-context");
	context.id = "at-symbol-suggestion-context";

	// Add title with matching search terms bolded (highlighted)
	const title = el.doc.createElement("div");
	title.addClass("suggestion-title");
	if (value[0]) {
		highlightSearch(title, value[0], value.obj, uniformize);
	} else if (value.obj?.originalAlias) {
		title.setText(value.obj?.originalAlias);
	} else if (value.obj?.alias) {
		title.setText(value.obj?.alias);
	} else if (value[1]) {
		highlightSearch(title, value[1], value.obj, uniformize);
	} else if (value.obj?.fileName) {
		title.setText(value.obj?.fileName);
	} else {
		title.setText("");
	}

	context.appendChild(title);
	if (limitToOneFile === 0 || limitToOneFile > 1) {
		const path = el.doc.createElement("div");
		path.addClass("suggestion-path");
		let pathText = "";
		if (value.obj?.isCreateNewOption) {
			pathText += `Create a new ${limitToOneFile > 1 ? "header" : "note"} in `;
		}
		pathText += value.obj?.filePath?.slice(0, -3);
		path.setText(pathText);
		context.appendChild(path);
	} else if (limitToOneFile === 1 && value.obj?.isCreateNewOption) {
		const path = el.doc.createElement("div");
		path.addClass("suggestion-path");
		path.setText("Create a new header");
		context.appendChild(path);
	}

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
