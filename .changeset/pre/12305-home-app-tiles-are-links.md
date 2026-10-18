---
'@object-ui/app-shell': patch
---

Each app tile in Home's "Your apps" strip is now a link to the app, so an app can be opened in a new tab and its address can be copied (objectui#12305).

The tile was a button that navigated when clicked, so it had no address. Middle-click and ⌘/Ctrl-click did nothing extra, the context menu offered no "Open link in new tab" or "Copy link address", and hovering showed no destination. The tile is now a router link to `/apps/SEGMENT`, where SEGMENT is the app's package id, or its name when it has none. The href carries the console's base path, so the browser's own link gestures open the real address. A plain left click still navigates inside the console. The tile keeps its classes and test id. The `app:launcher` page block draws the same strip, so its tiles change the same way. The "More" and "Show less" controls and the marketplace shortcut stay buttons, because they open nothing addressable.

Nothing is added to or removed from the package entry: no export, prop, type member or language-pack key.
