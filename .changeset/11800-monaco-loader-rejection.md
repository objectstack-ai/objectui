---
'@object-ui/app-shell': patch
---

Studio's source editors report a Monaco loader that cannot be reached once, as one console warning that names the URL, and no longer leave uncaught errors behind (objectui#11800).

On an install without access to the Monaco CDN (no egress, or a Content-Security-Policy that blocks it), opening a source page in Studio already fell back to a plain textarea, by design. The browser QA pass that found this also saw six uncaught `Event` errors and "Monaco initialization: error: Event" twice, in the dev build. The uncaught errors came from `@monaco-editor/loader`: every `loader.init()` call made while the loader fails leaves one rejected promise no caller can reach. The canvas preview, the inspector editor and the editor's own Monaco `Editor` each called it, and StrictMode doubled each call.

- The metadata designer's code editors (the JSON source tab and the html/react page source editor) call `loader.init()` once per page and share the answer.
- The Monaco `Editor` mounts only after the loader has resolved. While it loads, the editor area shows the skeleton it already showed while the editor module loaded. On a failing install the `Editor` never mounts, so it does not log its own init error.
- The one rejection the loader leaves unhandled is cancelled in an `unhandledrejection` listener that matches the loader's own failure by identity. Every other rejection on the page is still reported.
- The failure is logged once per page as a `console.warn` naming the cause. For a blocked CDN that is the loader script URL, e.g. `https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/loader.js`.

The textarea fallback looks and behaves as before, and still appears as soon as the loader fails. A source editor opened after the failure is known now shows the textarea on its first render. Monaco is still loaded from the CDN; serving it from the console's own assets is not part of this change. Nothing is added to the package entry: no export, prop, type member or language-pack key.
