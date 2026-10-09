---
'@object-ui/app-shell': minor
'@object-ui/i18n': minor
---

The keyboard-shortcuts dialog (`?`) lists only shortcuts that do something (objectui#11674).

**Clause-②: no (narrowing)**: no accept set changes; the dialog shows fewer rows, and seven unused `console.shortcuts.*` keys leave all ten locale packs.

The dialog was a static list, separate from every key handler, and six of its rows did nothing. `N` (create record), `R` (refresh data), `⌘/Ctrl+E` (edit record), `⌘/Ctrl+/` (focus search) and `⌘/Ctrl+D` (dark mode) had no handler anywhere, and the sidebar row said `B` while the sidebar toggles on `⌘/Ctrl+B`. The AI-assistant rows (`⌘/Ctrl+Shift+O`, `⌘/Ctrl+Shift+S`) were listed inside apps, where their only handler, on the AI chat page, is not mounted.

`@object-ui/app-shell`: each shortcut is now advertised beside its handler, for as long as that handler is mounted, and `KeyboardShortcutsDialog` lists what is advertised. Inside an app it lists `⌘K` (command palette), `?` (this dialog), `Esc` (close a dialog or panel) and `⌘B` (toggle the sidebar). The AI chat page advertises its own two shortcuts, so they are listed only where that page is mounted. Rows are grouped as before and sorted by their text. A host that mounts `KeyboardShortcutsDialog` outside the console layout now sees the shortcuts whose handlers it mounts, not a fixed list.

`@object-ui/i18n` (BREAKING; `minor` under this repository's release model, where objectui's major follows the `@objectstack` major): `console.shortcuts.focusSearch`, `createRecord`, `refreshData`, `editRecord`, `toggleDarkMode`, `groups.dataViews` and `groups.preferences` are removed from all ten packs. Nothing reads them now. A host that calls `t()` with one of them gets the key back; supply the string from your own resources if you still need it.
