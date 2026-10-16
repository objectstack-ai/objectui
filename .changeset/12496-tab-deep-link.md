---
'@object-ui/app-shell': patch
---

A `?tab=` deep link on a metadata item page now opens the sheet it names, and the URL keeps `tab` afterwards (objectui#12496).

The page writes `?tab=layers`, `references`, `related`, `history` or `audit` into the URL while a sheet is open, so that a refresh or a shared link reopens it. On mount, though, the effect that keeps the URL in sync ran first with no sheet open and deleted `tab` before the page read it, so no link opened anything and refreshing the page closed an open sheet.

The open sheet is now taken from `tab` when the page's sheet state is created. Only a sheet the page offers this caller is opened: History and Audit still need the authoring-trail capabilities (objectui#12475), so a `setup.access`-only caller gets no sheet from a link naming them. Related needs an item type with related anchors. An unknown or gated value opens nothing and is removed from the URL. Closing the sheet removes `tab`, as before.

No export, prop, type or language-pack key changes.
