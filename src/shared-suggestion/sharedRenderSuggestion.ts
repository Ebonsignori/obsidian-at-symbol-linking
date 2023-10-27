import { setIcon } from "obsidian";
import { fileOption } from "src/types";
import { highlightSearch } from "src/utils/highlight-search";

export default function sharedRenderSuggestion(
	value: Fuzzysort.KeysResult<fileOption>,
	el: HTMLElement
): void {
	el.addClass("at-symbol-linking-suggestion");
	const context = el.doc.createElement("div");
	context.addClass("suggestion-context");
	context.id = "at-symbol-suggestion-context";

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
