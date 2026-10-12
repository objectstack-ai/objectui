---
'@object-ui/plugin-list': patch
---

A gallery card whose title field is a lookup now shows the referenced record's name, not `[object Object]` (objectui#12188).

The card title printed the title field's value as plain text. A lookup value read through `$expand` is the related record, so the title read `[object Object]`. This showed on a record page's related list at phone width, which draws its rows as these cards titled by the first column: the organization page's Members tab showed `[object Object]` where the desktop grid showed the user's name. It also showed on any gallery view whose title field is a lookup. A lookup id that was not expanded printed as the raw id.

- A title field of type `lookup`, `master_detail`, `tree` or `user` now renders through the same cell renderer the grid and the card's own detail rows use. An expanded record shows its name. A bare lookup id is looked up and shows the record's name, as it does in the grid.
- The card's tooltip and its letter tile read an expanded record's display name instead of `[object Object]`.
- A plain text title is unchanged. The title text is now read the way the record's display name is read everywhere else: surrounding spaces are trimmed, and a value that is blank after trimming or is a list of values is not used as the title. Those cards fall back to the record's display name, as a card with an empty title field already did.

Nothing is added to the package entry: no export, prop or type member.
