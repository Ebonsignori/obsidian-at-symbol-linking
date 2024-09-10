import { AtSymbolLinkingSettings } from "../settings/compatibility";

export const isValidFileNameCharacter = (
	char: string,
	settings: AtSymbolLinkingSettings,
) => {
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
