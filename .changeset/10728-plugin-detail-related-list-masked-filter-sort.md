---
'@object-ui/plugin-detail': patch
---

`RelatedList`'s own filter box and sort no longer read a masked column's raw value (objectui#10728).

The related list draws a `password` / `secret` cell as `••••••` and, since objectui#10657,
flags the column `masked` on the table it renders. The table obeys the flag in its own
search and sort, but the list has a filter box and a sort of its own, and both still read
the raw value:

- The opt-in filter box (`filterable`) matched the term against every field of a row, so
  typing a substring of the credential kept its row.
- The sort buttons of a `list` card (`sortable`) were offered on every column, and sorted
  the rows by a masked one.

Both now read the same `masked` flag the list puts on its columns:

- The filter box matches the term against the columns the list shows that are not masked.
- A masked column gets no sort button. A sort by it is refused, including one the embedded
  table asks for (in a paged list that sort would be sent to the server as `$orderby`), and
  a sort set on a column before it was flagged stops ordering the rows.
- While the object definition is still loading, or after its read failed, every column is
  flagged, so in that window the filter box keeps no row and no sort button is offered.

Narrowing, stated: the filter box used to match any field a row carries. It now matches
only the columns the list shows, so a term that matches only a field no column shows no
longer keeps a row. This is the rule the table's own search already follows.

Columns without the flag filter and sort exactly as before.

Not covered: an authored `sort` (the list's `defaultSort`) that names a masked field is
still sent to the server as `$orderby` on a paged list.

The pending objectui#10657 related-list changeset lists the filter box and the `list`
card's sort buttons under "Also not covered". That entry no longer holds once this change
ships with it.

This is defence in depth. The real guard is still the server: ObjectStack's read mask
replaces `secret` and `password` values with its mask before they reach the browser.
