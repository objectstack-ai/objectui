---
'@object-ui/app-shell': patch
---

The console header no longer shows a "Search ⌘K" trigger where it would open nothing (objectui#11912).

On `/home`, `/ai`, `/organizations` and an organization's own pages, the header showed the search trigger, but no command palette is mounted in those frames: a click did nothing, and neither did `Ctrl+K`. `AppHeader` now draws the trigger (desktop and compact) only under a `CommandPaletteProvider`. Inside an app, where `ConsoleLayout` mounts the provider and `AppContent` mounts the palette, the trigger is unchanged and opens the palette as before.

Nothing is added to the package entry: no export, prop, type member or language-pack key. `useCommandPalette()` keeps its return shape and its no-op fallback outside a provider.
