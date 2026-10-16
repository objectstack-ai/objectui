---
'@object-ui/plugin-view': patch
---

The record drawer of an object view opens as a right-hand panel on a desktop, and stays a bottom sheet on a phone (objectui#11775).

An object view whose record surface is the drawer (an authored `layout: 'drawer'` or `navigation: { mode: 'drawer' }`, a light object on a desktop, or a page with nowhere to route) opened its create, edit and view form in vaul's `Drawer` with `direction: 'right'`. vaul applies the direction to the slide and the drag gesture only, and the shipped `DrawerContent` styles itself as a bottom sheet whatever the direction, so on a desktop the form drew as a sheet pinned to the bottom-left of the window, at most 672px wide, with a drag handle.

- **Desktop:** the form opens in the right-hand `Sheet`, full height and anchored to the right edge, the panel the console's record drawer (`NavigationOverlay` in drawer mode) already opens a record in. It keeps the width it had: the full window up to 672px.
- **Phone (below 768px):** the form stays on vaul's bottom sheet, which now slides up and is dragged down to close, the direction it is drawn in, and spans the screen at every phone width.

`DrawerContent` itself is unchanged, so every other bottom sheet draws as before.
