# @ Symbol Linking

This plugin adds ability to link with `@` (the At Symbol) in Obsidian. Can scope `@` linking to a specific directory e.g. `Contacts/`.

Useful if you're used to using `@` to link to people in other tools like GitHub or Slack.

I keep a directory of People in `People/` and whenever they popup in a journal entry I link to them with `@` to distinguish them as people as opposed to files.

## Settings

- Limit `@` links to specific directories, like your `Contacts/` directory.
- Use Obsidian style links, `[[filePath|linkText]]` or Markdown style links, `[linkText](filePath)`
- Include the `@` symbol in the final link text, e.g. `[@evan](./evan.md)` as opposed to `[evan](./evan.md)`

## Hotkeys

Supports `up`, `down` and `enter` keys for navigating the link search popup.

## Development

Feel free to open a PR to improve this, wrote this in a day borrowing heavily from [obsidian-completr](https://github.com/tth05/obsidian-completr) and [auto-note-mover](https://github.com/farux/obsidian-auto-note-mover).

1. Move this to your `.obsidian/plugins` directory in a vault you don't mind messing with
1. `npm i`
1. `npm run dev`
1. Add [hot-reload](https://github.com/pjeby/hot-reload) to the same `.obsidian/plugins` directory and enable it in Obsidian to ease development.