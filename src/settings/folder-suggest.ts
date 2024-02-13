import fuzzysort from "fuzzysort";
import { TAbstractFile, TFolder } from "obsidian";
import { highlightSearch } from "src/utils/highlight-search";
import { TextInputSuggest } from "src/utils/suggest";

export class FolderSuggest extends TextInputSuggest<
	Fuzzysort.KeyResult<TFolder>
> {
	getSuggestions(inputStr: string): Fuzzysort.KeyResult<TFolder>[] {
		const abstractFiles = this.app.vault.getAllLoadedFiles();
		const folders: TFolder[] = [];
		const lowerCaseInputStr = inputStr.toLocaleLowerCase();

		abstractFiles.forEach((folder: TAbstractFile) => {
			if (
				folder instanceof TFolder &&
				folder.path.toLocaleLowerCase()?.contains(lowerCaseInputStr)
			) {
				folders.push(folder);
			}
		});

		return fuzzysort.go(lowerCaseInputStr, folders, {
			key: "path",
		}) as any;
	}

	renderSuggestion(file: Fuzzysort.KeyResult<TFolder>, el: HTMLElement): void {
		highlightSearch(el, file);
	}

	selectSuggestion(file: Fuzzysort.KeyResult<TFolder>): void {
		this.inputEl.value = file.obj?.path;
		this.inputEl.trigger("input");
		this.close();
	}
}
