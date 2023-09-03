# Development

Feel free to fork and open a PR if something is missing or broken :heart:


### Local development

1. Move this to your `.obsidian/plugins` directory in a vault you don't mind messing with.
1. `npm i`
1. `npm run dev`
1. Add [hot-reload](https://github.com/pjeby/hot-reload) to the same `.obsidian/plugins` directory and enable it in Obsidian to ease development.

#### Tips and Tricks
1. `Cmd+alt+i` (in Mac) opens the Obsidian dev tools so you can debug with `console.log`
1. If you need to pause and inspect the popup and the pause hotkey isn't working for you, you can enter `setTimeout(() => { debugger; }, 5000)` in the dev-tools console to give yourself 5 seconds to open to popup before the inspector pauses execution so you can inspect the popup without it closing.
1. Use `this.app.emulateMobile(true);` to emulate mobile on desktop. This isn't perfect and you'll still need to test on mobile, but it's a good turnkey for some things.

### Releasing

Once changes are in `main`, add a tag reflecting the new semver (without the `v` prefix) and push the tag to the repo.

For example:
```
git tag 1.0.0
git push origin 1.0.0
```

[Release.yml](./.github/workflows/release.yml) will handle bumping the version and publishing a release to the [Releases Page](https://github.com/Ebonsignori/obsidian-at-symbol-linking/releases).

Remember to update the [newest release](https://github.com/Ebonsignori/obsidian-at-symbol-linking/releases) notes with any relevant changes.
