import { TFile } from "obsidian";
import fuzzysort from "fuzzysort";
import { highlightSearch } from "../utils/highlight-search";
import { TextInputSuggest } from "../utils/suggest";

export class FileSuggest extends TextInputSuggest<Fuzzysort.KeyResult<TFile>> {
	getSuggestions(inputStr: string): Fuzzysort.KeyResult<TFile>[] {
		let abstractFiles = this.app.vault.getAllLoadedFiles();
		const lowerCaseInputStr = inputStr.toLocaleLowerCase();

		abstractFiles = abstractFiles.filter((file) => {
			return file.path.endsWith(".md");
		});
		abstractFiles = abstractFiles.map((file) => {
			return {
				...file,
				path: file.path.slice(0, -3),
			};
		});

		return fuzzysort.go(lowerCaseInputStr, abstractFiles, {
			key: "path",
		}) as any;
	}

	renderSuggestion(file: Fuzzysort.KeyResult<TFile>, el: HTMLElement): void {
		highlightSearch(el, file);
	}

	selectSuggestion(file: Fuzzysort.KeyResult<TFile>): void {
		this.inputEl.value = file.obj?.path;
		this.inputEl.trigger("input");
		this.close();
	}
}
