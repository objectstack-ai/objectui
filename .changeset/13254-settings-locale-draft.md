---
'@object-ui/console': patch
---

A settings page loads its namespace when the namespace changes, and no longer when the translation function does (objectui#13254). The load used to re-run on every new translation function, and i18next hands one out on a language switch and on every translation bundle written into its store. So a bundle landing after the page had loaded, for example the app's own translations on a slow connection, sent a second `GET /api/settings/NAMESPACE` and dropped the edits in place: the field went back to its stored value and the "N unsaved changes" bar disappeared. The draft now resets only on a namespace change, a save or a discard. A load failure without a server message shows the pack's "Failed to load settings", translated when it is drawn.

A display-language switch in the console still drops a settings page's unsaved edits. The console shell remounts every page under it when the language changes, and this change does not touch the shell.
