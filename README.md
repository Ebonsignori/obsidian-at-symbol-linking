# Symbol Linking

![Gif demo of using the @ symbol to link to a name in Persons/](./docs/at-linking-example-1.4.4.gif)

Adds the ability to link using any trigger symbol in [Obsidian](https://obsidian.md/). Can limit the trigger linking to specific folders e.g. `People/`, or even a specific file (link will be done as a heading in the file).

Supports [aliases](https://help.obsidian.md/Linking+notes+and+files/Aliases) (nicknames for a file) that you can set in the properties/metadata of a note via the `alias` or `aliases` field.

## Settings
You can limit links to:
 - From specific directories, like your `People/` directory.
 - **Or** from **specific files**, like your `People.md` file. You can configure the level heading using the slider. 

Depending on the previous settings, the creation of a not found `@` link will:
 - Create a new note from a template in a specified directory (for directories linking)
 - **Only if a path is set in the `Use one file for all links`**, append the contact name in the file, as heading.

- Turn on compatibility mode to enable the linking when plugins that show suggestions like the [Tasks plugin](https://github.com/obsidian-tasks-group/obsidian-tasks) are enabled.
- Optionally include the trigger symbol in the final link text, e.g. `[@evan](./evan.md)` as opposed to `[evan](./evan.md)` (all trigger symbol will follow this setting.)

Uses the link type specified by your Obsidian `"Files & Links" -> "Use [[Wikiliks]]"` setting.

It is also possible to set a trigger per files or folders. By default, the default trigger will be set when a new folder/file is added.

## Hotkeys

Supports `up`, `down`, `enter`, and `escape` keys for navigating the link search popup.

## Installing

- [x] Using BRAT with https://github.com/mara-li/obsidian-custom-suggester → Or copy and open obsidian://brat?plugin=mara-li/obsidian-custom-suggester in your explorer or browser. It will automatically open Obsidian and install the plugin.
- [x] From the release page:
  - Download the latest release 
  - Unzip obsidian-custom-suggester.zip in .obsidian/plugins/ path 
  - In Obsidian settings, at "Community Plugin", reload the plugin list 
  - Enable the plugin (or reload it if already installed)

## Acknowledgements

[The Obsidian team](https://obsidian.md/about) for creating a wonderful product :purple_heart:

The implementation borrows from:

- [suggest.ts](./src/utils/suggest.ts), [file-suggest.ts](./src/settings/file-suggest.ts), [folder-suggest.ts](./src/settings/folder-suggest.ts), and [extension-popup.ts](./src/extension-version/extension-popup.ts) are derived from copyrighted works by [Liam Cain](https://github.com/liamcain), [obsidian-periodic-notes](https://github.com/liamcain/obsidian-periodic-notes).
- [obsidian-completr](https://github.com/tth05/obsidian-completr): For suggestion popup hotkey handling
- [@ symbol linking](https://github.com/Ebonsignori/obsidian-at-symbol-linking): Original plugin
