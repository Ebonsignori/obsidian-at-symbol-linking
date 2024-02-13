// Code derived from https://github.com/tth05/obsidian-completr
import { KeymapContext } from "obsidian";
import { SelectionDirection } from "./suggest-popup";

// Hacky override that lets us use hotkeys when the popup is open from completr
export function applyHotKeyHack(_this: any, app: any) {
	// This replaces the default handler for commands. This is needed because the default handler always consumes
	// the event if the command exists.
	app.scope.keys = [];

	const isHotkeyMatch = (
		hotkey: any,
		context: KeymapContext,
		isBypassCommand: boolean
	): boolean => {
		// Copied from original isMatch function, modified to not require exactly the same modifiers for
		// completr-bypass commands. This allows triggering for example Ctrl+Enter even when
		// pressing Ctrl+Shift+Enter. The additional modifier is then passed to the editor.

		/* Original isMatch function:
            var n = e.modifiers
                , i = e.key;
            return (null === n || n === t.modifiers) && (!i || (i === t.vkey || !(!t.key || i.toLocaleLowerCase() !== t.key.toLocaleLowerCase())))
            */

		const modifiers = hotkey.modifiers,
			key = hotkey.key;
		if (
			modifiers !== null &&
			(isBypassCommand
				? !context?.modifiers?.contains(modifiers)
				: modifiers !== context.modifiers)
		)
			return false;
		return (
			!key ||
			key === context.vkey ||
			!(!context.key || key.toLocaleLowerCase() !== context.key.toLocaleLowerCase())
		);
	};
	_this.app.scope.register(
		null,
		null,
		(e: KeyboardEvent, t: KeymapContext) => {
			const hotkeyManager = app.hotkeyManager;
			hotkeyManager.bake();
			for (
				let bakedHotkeys = hotkeyManager.bakedHotkeys,
					bakedIds = hotkeyManager.bakedIds,
					r = 0;
				r < bakedHotkeys.length;
				r++
			) {
				const hotkey = bakedHotkeys[r];
				const id = bakedIds[r];
				const command = app.commands.findCommand(id);
				const isBypassCommand = command?.isBypassCommand?.();
				if (isHotkeyMatch(hotkey, t, isBypassCommand)) {
					// Condition taken from original function
					if (!command || (e.repeat && !command.repeatable)) {
						continue;
					} else if (command.isVisible && !command.isVisible()) {
						//HACK: Hide our commands when to popup is not visible to allow the keybinds to execute their default action.
						continue;
					} else if (isBypassCommand) {
						_this._suggestionPopup.close();

						// @ts-expect-error sure it could be null
						const validMods = t.modifiers
							.replace(new RegExp(`${hotkey.modifiers},*`), "")
							.split(",");
						// Sends the event again, only keeping the modifiers which didn't activate this command
						const event = new KeyboardEvent("keydown", {
							key: hotkeyManager.defaultKeys[id][0].key,
							ctrlKey: validMods?.contains("Ctrl"),
							shiftKey: validMods?.contains("Shift"),
							altKey: validMods?.contains("Alt"),
							metaKey: validMods?.contains("Meta"),
						});
						e?.target?.dispatchEvent(event);
						return false;
					}

					if (app.commands.executeCommandById(id)) return false;
				}
			}
		}
	);

	_this.addCommand({
		id: "select-next-suggestion",
		name: "Select next suggestion",
		hotkeys: [
			{
				key: "ArrowDown",
				modifiers: [],
			},
		],
		repeatable: true,
		editorCallback: () => {
			_this._suggestionPopup.selectNextItem(SelectionDirection.NEXT);
		},
		isVisible: () => _this._suggestionPopup?.isVisible(),
	});
	_this.addCommand({
		id: "select-previous-suggestion",
		name: "Select previous suggestion",
		hotkeys: [
			{
				key: "ArrowUp",
				modifiers: [],
			},
		],
		repeatable: true,
		editorCallback: () => {
			_this._suggestionPopup.selectNextItem(SelectionDirection.PREVIOUS);
		},
		isVisible: () => _this._suggestionPopup?.isVisible(),
	});
	_this.addCommand({
		id: "insert-selected-suggestion",
		name: "Insert selected suggestion",
		hotkeys: [
			{
				key: "Enter",
				modifiers: [],
			},
		],
		editorCallback: () => _this._suggestionPopup.applySelectedItem(),
		isVisible: () => _this._suggestionPopup?.isVisible(),
	});
	_this.addCommand({
		id: "exit-suggestion",
		name: "Exit suggestions",
		hotkeys: [
			{
				key: "Escape",
				modifiers: [],
			},
		],
		editorCallback: () => _this._suggestionPopup.closeSuggestion(),
		isVisible: () => _this._suggestionPopup?.isVisible(),
	});
}
