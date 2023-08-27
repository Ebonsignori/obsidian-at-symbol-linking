# @ Symbol Linking

![Gif demo of using the @ symbol to link to a name in Persons/](./docs/at-symbol-linking-1.1.0.gif)

Adds the ability to link using the `@` (the At Symbol) in [Obsidian](https://obsidian.md/). Can scope `@` linking to only source links from specific directories e.g. `Contacts/`.

Useful if you're used to using `@` to link to people in other tools like GitHub or Slack.

I keep a directory of contacts in `People/` and whenever I want to reference them in a journal entry I link to them with `@` to distinguish them as people as opposed to files.

## Settings

- Limit `@` links to only source links from specific directories, like your `Contacts/` directory.
- Optionally include the `@` symbol in the final link text, e.g. `[@evan](./evan.md)` as opposed to `[evan](./evan.md)`
- Can add the option to create a new note from a template in a specified directory if no `@` link is found.

Uses the link type specified by your Obsidian `"Files & Links" -> "Use [[Wikiliks]]"` setting.

## Hotkeys

Supports `up`, `down`, `enter`, and `escape` keys for navigating the link search popup.

## Installing

The preferred method is adding this through the [built-in community plugin browser](https://help.obsidian.md/Extending+Obsidian/Community+plugins) in Obsidian.

### Manual installation

1. Create a new folder in your vault, `.obsidian/plugins/at-symbol-linking`
1. Download and move the files from the latest release in the [Releases Page](https://github.com/Ebonsignori/obsidian-at-symbol-linking/releases) to the new folder, `.obsidian/plugins/at-symbol-linking`
1. In Obsidian go to `Settings -> Community Plugins`
1. Enable community plugins if they aren't already enabled, then and enable the checkbox for `@ Symbol Linking`

## Contributing 

Please [open an issue](https://github.com/Ebonsignori/obsidian-at-symbol-linking/issues/new) with any suggestions or bug reports.

Or feel free to fork and open a PR :heart:

### Local development

1. Move this to your `.obsidian/plugins` directory in a vault you don't mind messing with.
1. `npm i`
1. `npm run dev`
1. Add [hot-reload](https://github.com/pjeby/hot-reload) to the same `.obsidian/plugins` directory and enable it in Obsidian to ease development.

### Releasing

Once changes are in `main`, add a tag reflecting the new semver (without the `v` prefix) and push the tag to the repo.

For example:
```
git tag 1.0.0
git push origin 1.0.0
```

[Release.yml](./.github/workflows/release.yml) will handle bumping the version and publishing a release to the [Releases Page](https://github.com/Ebonsignori/obsidian-at-symbol-linking/releases).

Remember to update the [newest release](https://github.com/Ebonsignori/obsidian-at-symbol-linking/releases) notes with any relevant changes.

## Acknowledgements

[The Obsidian team](https://obsidian.md/about) for creating a wonderful product :purple_heart:

The implementation borrows from:

- [obsidian-completr](https://github.com/tth05/obsidian-completr): For suggestion popup hotkey handling
- [auto-note-mover](https://github.com/farux/obsidian-auto-note-mover): For folder suggesting in settings 
