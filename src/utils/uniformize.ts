if (!String.prototype.hasOwnProperty("removeAccents")) {
	Object.defineProperty(String.prototype, "removeAccents", {
		value: function () {
			return this.normalize("NFD").replace(/\p{Diacritic}/gu, "");
		},
		enumerable: false,
		configurable: true,
	});
}
