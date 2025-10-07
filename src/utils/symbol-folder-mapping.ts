import { AtSymbolLinkingSettings } from "src/settings/settings";

export interface SymbolTriggerInfo {
	isGlobalSymbol: boolean;
	specificFolders?: string[];
}

/**
 * Determines if a character is a trigger symbol and which folder(s) corresponds to the symbol
 * @param typedChar The character that was typed
 * @param settings The plugin settings
 * @returns SymbolTriggerInfo if the character is a trigger symbol, null otherwise
 */
export function getSymbolTriggerInfo(
	typedChar: string,
	settings: AtSymbolLinkingSettings
): SymbolTriggerInfo | null {
	// Check if it's the default trigger symbol
	if (typedChar === settings.globalTriggerSymbol) {
		// If there are folder limitations configured, check if any apply to the default symbol
		if (settings.limitLinkDirectories.length > 0) {
			const matchingFolders: string[] = [];
			for (const mapping of settings.limitLinkDirectories) {
				// Include folders with the default symbol OR folders with no symbol set (empty/undefined)
				if (
					mapping.folder &&
					(mapping.symbol === settings.globalTriggerSymbol || !mapping.symbol || mapping.symbol.trim() === "")
				) {
					matchingFolders.push(mapping.folder);
				}
			}
			
			// If there are matching folders for the default symbol, limit to those
			// If there are NO matching folders, it means all folders have other symbols,
			// so default symbol should be unrestricted (show all folders)
			return {
				isGlobalSymbol: true,
				specificFolders: matchingFolders.length > 0 ? matchingFolders : undefined,
			};
		}
		
		// No folder limitations at all, so default symbol shows all folders
		return {
			isGlobalSymbol: true,
		};
	}

	// Check if it's a folder-specific symbol and collect all folders with this symbol
	const matchingFolders: string[] = [];
	for (const mapping of settings.limitLinkDirectories) {
		if (mapping.symbol && mapping.symbol === typedChar && mapping.folder) {
			matchingFolders.push(mapping.folder);
		}
	}

	if (matchingFolders.length > 0) {
		return {
			isGlobalSymbol: false,
			specificFolders: matchingFolders,
		};
	}

	return null;
}

/**
 * Gets all trigger symbols (default + folder-specific)
 * @param settings The plugin settings
 * @returns Array of all trigger symbols
 */
export function getAllTriggerSymbols(
	settings: AtSymbolLinkingSettings
): string[] {
	const symbols = [settings.globalTriggerSymbol];
	for (const mapping of settings.limitLinkDirectories) {
		if (mapping.symbol && mapping.symbol.trim()) {
			symbols.push(mapping.symbol);
		}
	}
	return symbols;
}
