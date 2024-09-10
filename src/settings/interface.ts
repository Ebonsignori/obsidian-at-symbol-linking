export interface CustomTriggerPerLimit {
	triggerSymbol?: string;
	path: string;
}

export interface SymbolLinkingSettings {
	triggerSymbol: string;
	includeSymbol: boolean;
	_enableOneFile: boolean;
	appendAsHeader: boolean;
	headerLevelForContact: number;
	showAddNewNote: boolean;
	addNewNoteTemplateFile: string;
	addNewNoteDirectory: string;
	useCompatibilityMode: boolean;
	leavePopupOpenForXSpaces: number;
	invalidCharacterRegex: string;
	invalidCharacterRegexFlags: string;
	removeAccents: boolean;
}

export interface AtSymbolLinkingSettings extends SymbolLinkingSettings {
	limitLinkDirectories: Array<string>;
	limitToOneFile: Array<string>;
	limitLinkDirectoriesWithTrigger: CustomTriggerPerLimit[];
	limitToOneFileWithTrigger: CustomTriggerPerLimit[];
}

export interface CustomSuggester extends SymbolLinkingSettings {
	limitToDirectories: CustomTriggerPerLimit[];
	limitToFile: CustomTriggerPerLimit[];
	_converted?: boolean;
}

export const DEFAULT: SymbolLinkingSettings = {
	triggerSymbol: "@",
	includeSymbol: true,
	appendAsHeader: false,
	headerLevelForContact: 1,
	_enableOneFile: false,
	showAddNewNote: false,
	addNewNoteTemplateFile: "",
	addNewNoteDirectory: "",
	useCompatibilityMode: false,
	leavePopupOpenForXSpaces: 0,
	invalidCharacterRegex: `[\[\]^|#]`,
	invalidCharacterRegexFlags: "i",
	removeAccents: true,
};

export const DEFAULT_SETTINGS: CustomSuggester = {
	...DEFAULT,
	limitToDirectories: [],
	limitToFile: [],
};
