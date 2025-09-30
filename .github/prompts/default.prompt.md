---
mode: agent
---
This project is an Obsidian plugin that runs on the Obsidian Application.

It is written in TypeScript and uses the Obsidian API.

The reference for the Obsidian API can be found in the `reference` directory of this repository.

The most useful references will be the `TypeScript API` in the `reference` directory.

## Project overview

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