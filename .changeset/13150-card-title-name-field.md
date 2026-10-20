---
'@object-ui/plugin-grid': patch
---

On phone-width screens, each record card in a grid is now titled by the object's declared `nameField`, not by the view's first column (objectui#13150).

- **The record's name is the card title.** Before, a view whose first column was Owner titled every card with the owner's name, and the record's own name sat in a row at the bottom of the card. When the name field is a column of the view, that column now titles the card and is not repeated in the card body. The first column it replaced is shown as an ordinary body row.
- **The name titles the card even when no column shows it.** The grid already fetches the declared `nameField` for every row, so the card reads it from the row.
- **No other field stands in for the declared name.** When a row has no value for the declared name field (for example, the viewer may not read it), the card title shows the empty marker, not another field's value. Objects that declare no `nameField` keep the first column as the card title.

Nothing is added to the package entry: no export, prop or type member.
