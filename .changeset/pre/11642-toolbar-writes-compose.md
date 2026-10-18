---
'@object-ui/app-shell': patch
---

Two grid toolbar changes to one view in one session now both survive a reload (objectui#11642). Before, the second change overwrote the first: changing density and then sorting by a column header kept only the sort. This held on every kind of view row: a served view's ViewItem envelope, a saved view stored flat, and a personalization overlay.

The console saves a toolbar change with `PUT /api/v1/meta/view/NAME`, which replaces the whole row. It built each body from the view as it was when the page loaded, or, for an overlay, from the new change alone. Nothing refreshed that starting point after a save landed, so each later save dropped the earlier one.

Each toolbar save now starts from the row the store holds when the save runs. The console reads it back with the same `GET /api/v1/meta/view` request the page load makes, because the save answer carries no row and the save door drops undeclared keys from the body it receives. A saved view's change is placed on that row. An overlay keeps the keys it already stored, the ones `VIEW_OVERLAY_OWNED_KEYS` in `@object-ui/data-objectstack` names, and the new change is added to them, so the overlay still holds nothing the view it shadows owns. Saves to the same view run one after another, so a change made while the previous save is still in flight starts from the row that save stored. Two changes made within the save debounce are still sent as one save.

**Clause-②: no.** Nothing on the package entry changes.
