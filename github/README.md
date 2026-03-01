# GitHub

Browse your code on GitHub directly from Nixium. The extension reads your repository's `.git/config` to discover the GitHub remote — no configuration needed.

## Features

| Command | Description |
|---|---|
| **GitHub: Open File on GitHub** | Opens the current file in the GitHub blob view in your browser |
| **GitHub: Copy File URL** | Copies the `github.com` file URL to the clipboard |
| **GitHub: Open Blame on GitHub** | Opens the git blame view for the current file |
| **GitHub: Open Repository** | Opens the repository root on github.com |
| **GitHub: Copy Repository URL** | Copies the repository base URL to the clipboard |

## Usage

1. Open a folder that is a git repository with a GitHub remote.
2. Enable this extension from **Extensions → Installed**.
3. Open a file and run any `GitHub:` command from the command palette (`Ctrl+Shift+P`).

## Requirements

- The workspace folder (or a parent of it) must be a git repository.
- The repository must have a remote whose URL points to `github.com` (SSH or HTTPS).

**SSH remote example:**
```
git@github.com:owner/repo.git
```

**HTTPS remote example:**
```
https://github.com/owner/repo.git
```

If you have multiple remotes, `origin` is preferred. Otherwise the first GitHub remote found in `.git/config` is used.

## How it works

1. Walks up from the opened workspace root looking for a `.git` directory.
2. Reads `.git/config` to find the GitHub remote URL.
3. Reads `.git/HEAD` to determine the current branch name.
4. Constructs a `https://github.com/owner/repo/blob/<branch>/<file>` URL.

All reads go through Nixium's own `/api/fs/read` endpoint — no external network calls are made except to open the resulting GitHub URL.

## Limitations

- Requires the repository to be pushed to GitHub (local-only repos won't work).
- The file URL is always based on the current branch tip — it does **not** create a permalink to a specific commit.
