# Word Count

Displays word, character, and line statistics for the active file directly in the notification bar.

## Features

- **Word Count: Show Stats** — counts words, characters (total and non-whitespace), and lines in the currently open file.

## Usage

Open the command palette (`Ctrl+Shift+P` or `F1`) and run:

```
Word Count: Show Stats
```

A notification will appear at the bottom of the screen with a summary like:

```
Lines: 42  ·  Words: 318  ·  Chars: 1 924 (1 606 without spaces)
```

## Notes

- Words are split on whitespace (spaces, tabs, newlines).
- The count reflects the in-editor content, including unsaved changes.
- An error is shown if no file is currently open.

## Installation

The extension is located at:

```
~/.config/nixium/extensions/word-count/
```

Enable it from **Extensions → Installed** in the sidebar.
