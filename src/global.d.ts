declare global {
	interface String {
		/**
		 * Remove accents from a string.
		 * @returns {string}
		 */
		removeAccents(): string;
	}
}
export {};
