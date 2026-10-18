---
'@object-ui/app-shell': patch
---

On an object that declares no list view, a grid toolbar change no longer sends a save the door refuses (objectui#11643). Such an object opens on the "All Records" tab the console makes for it, whose id is `all`. A density change there used to send `PUT /api/v1/meta/view/all` with no `viewKind`, the door answered `422 INVALID_METADATA`, an error toast appeared, and the density was gone on reload.

That tab is not a stored or served view, so there is no row to save into. Its toolbar changes (density, sort, hidden fields, column order and widths, inline edit) now apply for the session only: the list keeps them, no request is sent and no error is shown. No view is created to hold them; an object that wants saved toolbar settings declares a list view, and the served-view save path applies to it.

The console tells its own tab apart by where it was made, not by its id. A served view whose tab id is also `all`, a saved view beside the console's tab, and a stored row named `all` that shadows that tab all keep saving as before.

**Clause-②: no.** Nothing on the package entry changes.
