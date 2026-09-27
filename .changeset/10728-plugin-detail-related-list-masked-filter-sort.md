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
  table asks for (in a server-paged list that sort would be sent to the server as
  `$orderby`). In a list that sorts in the browser (one that is not server-paged), a sort
  set on a column before it was flagged also stops ordering the rows.
- While the object definition is still loading, or after its read failed, every column is
  flagged, so in that window the filter box keeps no row and no sort button is offered.

Narrowing, stated: the filter box used to match any field a row carries. It now matches
only the columns the list shows, so a term that matches only a field no column shows no
longer keeps a row. This is the rule the table's own search already follows.

Columns without the flag filter and sort exactly as before.

Not covered:

- An authored `sort` (the list's `defaultSort`) that names a masked field is still sent to
  the server as `$orderby` on a server-paged list.
- On a server-paged list, a sort the user set on a column before that column was flagged
  is still sent to the server as `$orderby` with each page the list fetches, until the
  user sorts by another column. The column is flagged after the sort only when the
  `columns` or the object of a list already on screen change (a direct React consumer of
  `RelatedList`); `record:related_list` sets both once per block, so it does not reach
  this.

The pending objectui#10657 related-list changeset lists the filter box and the `list`
card's sort buttons under "Also not covered". That entry no longer holds once this change
ships with it.

This is defence in depth. The real guard is still the server: ObjectStack's read mask
replaces `secret` and `password` values with its mask before they reach the browser.
