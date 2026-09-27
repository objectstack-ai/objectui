---
'@object-ui/components': patch
---

`data-table` no longer searches, sorts or sizes a `masked` column by its raw value (objectui#10657, which folded objectui#10658).

`TableColumn.masked` already withheld a credential column's raw value from the keyboard
copy, the cell tooltip, the CSV export and inline edit (objectui#10583). Three more of the
table's own paths still read it:

- The client-side search matched a term against it, so typing a substring answered
  "does the credential contain this?", one character at a time.
- The sort ordered the rows by it, from the header and from the header menu. Under
  manual sorting the header asked the host to do the same.
- The automatic width was estimated from its length, so the column grew with the
  credential.

On a `masked` column now:

- The client-side search leaves the column out of its predicate.
- Its sort is disabled: the header does not sort and shows no sort indicator, the header
  menu offers no sort, with client and manual sorting alike, and a client sort already
  set on the column (before its producer set the flag) stops ordering the rows.
- Its automatic width is sized from its header, never from its values.

Columns without the flag search, sort and size exactly as before. This reaches every host
that runs the table's search and sort in the browser: `object-grid` over inline data or
while grouped, `object-data-table`, and any `data-table` authored directly.

This is defence in depth. The real guard is still the server: ObjectStack's read mask
replaces `secret` and `password` values with its mask before they reach the browser. With
`manualSearch`, the table searches nothing itself, so what the host's search matches is up
to the host and its server.

The pending objectui#10583 changeset lists the client-side search, the sort and the width
under "Not covered", and says the related list and `object-data-table` do not set the flag
yet. Those entries no longer hold once this change ships with it.
