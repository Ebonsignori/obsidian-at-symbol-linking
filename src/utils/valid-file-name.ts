import type { CustomSuggester } from "../settings/interface";

export const isValidFileNameCharacter = (char: string, settings: CustomSuggester) => {
	if (char === " ") {
		return true;
	}
	if (char === "\\") {
		return false;
	}
	return !new RegExp(
		settings.invalidCharacterRegex,
		settings.invalidCharacterRegexFlags,
	).test(char);
};
