---
'@object-ui/plugin-detail': patch
'@object-ui/fields': patch
---

The record page's highlight strip no longer cuts a value without saying so, and at phone width it uses one layout (objectui#12523).

- **A cut value ends in an ellipsis.** The email, URL and phone cells drew their text inside an `inline-flex` anchor. A host that clips to one line, such as a highlight chip, cut that text mid-word with no ellipsis: the cell was one atomic inline box, and a browser clips the first atomic inline on a line instead of ellipsing it. The three cells now follow the single-line convention the other cells in `@object-ui/fields` use. The cell is bounded by its host, and the box that holds the text truncates with an ellipsis. In the highlight strip the whole value is still the clip box's `title`. A host wider than the value shows no change.
- **A phone declared through `format` gets the phone width.** A `text` field with `format: 'phone'` (or `email` / `url`) drew the phone cell on the narrow 9rem chip, so the HotCRM lead's phone read "+1-555-0" at 1440. The strip now sizes a chip by the cell it draws, so that phone gets the same 16rem floor as a `phone` field. When the floors no longer fit one line, the strip wraps before it cuts a value.
- **A wrapped line starts flush.** From `sm` up, the first chip of every line now hides its separator and left padding, not only the strip's first chip. A second line no longer reads as an indented list.
- **One layout below `sm`.** Every chip is a full-width line with no separator. Two chips no longer sit side by side above a single-column list.
