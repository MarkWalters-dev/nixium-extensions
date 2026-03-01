# nixium-extensions

> 100% vibe coded

Official extension registry for [Nixium](https://github.com/MarkWalters-dev/nixium) — the minimal, keyboard-driven code editor built with Rust and SvelteKit.

## Extensions

| Name | Description |
|------|-------------|
| [word-count](./word-count/) | Counts words, characters, and lines in the active file |
| [github](./github/) | Open files on GitHub, copy URLs, and browse blame |

## Registry

The [`registry.json`](./registry.json) at the root of this repo is the source of truth for the Nixium extension store. Each entry looks like:

```json
{
  "name": "my-extension",
  "displayName": "My Extension",
  "version": "1.0.0",
  "description": "What it does.",
  "author": "your-github-handle",
  "download_url": "https://github.com/MarkWalters-dev/nixium-extensions/archive/refs/heads/main.zip",
  "readme_url": "https://raw.githubusercontent.com/MarkWalters-dev/nixium-extensions/main/my-extension/README.md",
  "tags": ["tag1", "tag2"]
}
```

## Writing an Extension

Each extension lives in its own subdirectory and must contain:

```
my-extension/
  manifest.json   # metadata
  index.js        # ES module with an activate(api) export
  README.md       # shown in the Nixium extension store
```

### manifest.json

```json
{
  "name": "my-extension",
  "displayName": "My Extension",
  "version": "1.0.0",
  "description": "Short description.",
  "author": "you",
  "main": "index.js"
}
```

### index.js

```js
export function activate(api) {
  api.registerCommand("My Extension: Do Something", async () => {
    const content = await api.getActiveFileContent();
    api.showNotification("Done!");
  });
}
```

### Available API

| Method | Description |
|--------|-------------|
| `api.getActiveFilePath()` | Returns the current file path |
| `api.getActiveFileContent()` | Returns the current file's text content |
| `api.openFile(path)` | Opens a file in the editor |
| `api.registerCommand(name, fn)` | Registers a command palette entry |
| `api.showNotification(msg)` | Shows a toast notification |

## Contributing

1. Fork this repo
2. Create your extension in a new subdirectory
3. Add an entry to `registry.json`
4. Open a pull request

## License

MIT
