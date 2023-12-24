const validCharRegex =
	/[a-z0-9\\$\\-\\_\\!\\%\\"\\'\\.\\,\\*\\&\\@\\(\\)\\;\\{\\}\\+\\=\\~\\`\\?\\<\\>)]/i;

export const isValidFileNameCharacter = (char: string) => {
	if (char === " ") {
		return true;
	}
	if (char === "\\") {
		return false;
	}
	return validCharRegex.test(char);
};
