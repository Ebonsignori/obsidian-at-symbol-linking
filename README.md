# @ Symbol Linking

![Gif demo of using the @ symbol to link to a name in Persons/](./docs/at-linking-example-1.4.4.gif)

Adds the ability to link using the `@` (the At Symbol) in [Obsidian](https://obsidian.md/). Can limit `@` linking to to specific folders e.g. `People/`.

Supports [aliases](https://help.obsidian.md/Linking+notes+and+files/Aliases) (nicknames for a file) that you can set in the properties/metadata of a note via the `alias` or `aliases` field.

## Settings

- Limit `@` links to only source links from specific directories, like your `People/` directory.
- Can create a new note from a template in a specified directory if no `@` link is found.
- Turn on compatibility mode to enable `@` linking when plugins that show suggestions like the [Tasks plugin](https://github.com/obsidian-tasks-group/obsidian-tasks) are enabled.
- Optionally include the `@` symbol in the final link text, e.g. `[@evan](./evan.md)` as opposed to `[evan](./evan.md)`

Uses the link type specified by your Obsidian `"Files & Links" -> "Use [[Wikiliks]]"` setting.

## Hotkeys

Supports `up`, `down`, `enter`, and `escape` keys for navigating the link search popup.

## Installing

Search "@ symbol linking" via the [built-in community plugin browser](https://help.obsidian.md/Extending+Obsidian/Community+plugins) in Obsidian.

## Contributing 

Please [open an issue](https://github.com/Ebonsignori/obsidian-at-symbol-linking/issues/new) with any suggestions or bug reports.

See [developer docs](docs/development.md) if you'd like to open a PR. 

## Acknowledgements

[The Obsidian team](https://obsidian.md/about) for creating a wonderful product :purple_heart:

The implementation borrows from:

- [suggest.ts](./src/utils/suggest.ts), [file-suggest.ts](./src/settings/file-suggest.ts), [folder-suggest.ts](./src/settings/folder-suggest.ts), and [extension-popup.ts](./src/extension-version/extension-popup.ts) are derived from copyrighted works by [Liam Cain](https://github.com/liamcain), [obsidian-periodic-notes](https://github.com/liamcain/obsidian-periodic-notes).
- [obsidian-completr](https://github.com/tth05/obsidian-completr): For suggestion popup hotkey handling
