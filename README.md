# @ Symbol Linking

![Gif demo of using the @ symbol to link to a name in Persons/](./docs/at-symbol-linking-1.1.0.gif)

Adds the ability to link using the `@` (the At Symbol) in [Obsidian](https://obsidian.md/). Can scope `@` linking to only source links from specific directories e.g. `Contacts/`.

Useful if you're used to using `@` to link to people in other tools like GitHub or Slack.

I keep a directory of contacts in `People/` and whenever I want to reference them in a journal entry I link to them with `@` to distinguish them as people as opposed to files.

## Settings

- Limit `@` links to only source links from specific directories, like your `Contacts/` directory.
- Use Obsidian style links, `[[filePath|linkText]]` or Markdown style links, `[linkText](filePath)`
- Optionally include the `@` symbol in the final link text, e.g. `[@evan](./evan.md)` as opposed to `[evan](./evan.md)`

## Hotkeys

Supports `up`, `down`, `enter`, and `escape` keys for navigating the link search popup.

## Contributing 

Feel free to open a PR to improve this.

The implementation borrows from:

- [obsidian-completr](https://github.com/tth05/obsidian-completr): For suggestion popup hotkey handling
- [auto-note-mover](https://github.com/farux/obsidian-auto-note-mover): For folder suggesting in in settings 

### Local development

1. Move this to your `.obsidian/plugins` directory in a vault you don't mind messing with.
1. `npm i`
1. `npm run dev`
1. Add [hot-reload](https://github.com/pjeby/hot-reload) to the same `.obsidian/plugins` directory and enable it in Obsidian to ease development.