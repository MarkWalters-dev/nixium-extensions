/**
 * Word Count extension for Nixium.
 *
 * Adds a "Word Count: Show Stats" command to the command palette that
 * displays word / character / line counts for the active file.
 */

/** @param {import('/api/extensions/word-count/script').ExtensionAPI} api */
export function activate(api) {
  api.registerCommand('wordcount.show', 'Word Count: Show Stats', () => {
    const content = api.getActiveFileContent();
    if (content === null) {
      api.showNotification('No file is open.', 'error');
      return;
    }

    const lines = content.split('\n').length;
    const words = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
    const chars = content.length;
    const charsNoSpaces = content.replace(/\s/g, '').length;

    api.showNotification(
      `Lines: ${lines}  ·  Words: ${words}  ·  Chars: ${chars} (${charsNoSpaces} without spaces)`,
      'info'
    );
  });
}

export function deactivate() {
  // Nothing to clean up — registered command is removed automatically.
}
