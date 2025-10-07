---
mode: agent
---
This project is an Obsidian plugin that runs on the Obsidian Application.

It is written in TypeScript and uses the Obsidian API.

The reference for the Obsidian API can be found in the `reference` directory of this repository.

The most useful references will be the `TypeScript API` in the `reference` directory.

## Project overview

![Gif demo of using the @ symbol to link to a name in Persons/](./docs/at-linking-example-1.4.4.gif)

Adds the ability to link using any symbol (e.g. `@`) in [Obsidian](https://obsidian.md/). Can limit linking to specific folders, like `People/`, or map specific characters to open specific folders, like `$` to open `References/` and `@` to open `People/` for more information see [release 2.0 notes](https://github.com/Ebonsignori/obsidian-at-symbol-linking/releases/tag/2.0.0).

Supports [aliases](https://help.obsidian.md/Linking+notes+and+files/Aliases) (nicknames for a file) that you can set in the properties/metadata of a note via the `alias` or `aliases` field.

## Settings

-   Limit symbol links to only source links from specific directories, like your `People/` directory.
-   Create a new note from a template in a specified directory if no symbol link is found.
    -   As of `v2+` you can specify symbols to create notes from specific templates in given directories.
-   Turn on compatibility mode to enable symbol linking when plugins that show suggestions like the [Tasks plugin](https://github.com/obsidian-tasks-group/obsidian-tasks) are enabled.
-   Optionally include the linking symbol in the final link text, e.g. `[@evan](./evan.md)` as opposed to `[evan](./evan.md)`

### Inferred settings

-   Uses the link type specified by your Obsidian `"Files & Links" -> "Use [[Wikilinks]]"` setting.
-   Uses the link format specified by your Obsidian `"Files & Links" -> "New link format"` setting.

## Hotkeys

Supports `up`, `down`, `enter`, and `escape` keys for navigating the link search popup.