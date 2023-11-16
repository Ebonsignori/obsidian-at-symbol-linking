const validCharRegex =
	/[a-z0-9\\$\\-\\_\\!\\%\\"\\'\\.\\,\\*\\&\\(\\)\\;\\{\\}\\+\\=\\~\\`\\?\\<\\>)]/i;

const validUnicodeRegex = 
	/[\p{Letter}0-9\\$\\-\\_\\!\\%\\"\\'\\.\\,\\*\\&\\(\\)\\;\\{\\}\\+\\=\\~\\`\\?\\<\\>)]/iu;

export const isValidFileNameCharacter = (char: string, useUnicodeName: boolean) => {
	if (char === " ") {
		return true;
	}
	if (char === "\\") {
		return false;
	}
	if (useUnicodeName) {
		return validUnicodeRegex.test(char);
	} else {
		return validCharRegex.test(char);
	}
};
