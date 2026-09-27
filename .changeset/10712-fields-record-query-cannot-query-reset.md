---
'@object-ui/fields': patch
---

fix(fields): `useRecordQuery` commits nothing once it can no longer query, and a pending debounced search never runs an older query (objectui#10712)

`useRecordQuery`, the query kernel behind `LookupField`, the people picker and
`RecordPickerDialog`, cleared its records when `enabled` went false (a dialog
closing), but a read still in flight at that moment was the latest run: its
answer committed over the cleared state, and the loading state stayed on until
it landed. `reset()` had the same gap. When `objectName` or `dataSource` went
null nothing was cleared at all, so the previous object's records stayed and a
read in flight committed.

Now the reset applies whenever the hook can no longer query (`enabled` false,
or no data source or object name) and on `reset()`: it supersedes any read in
flight, so that read's answer commits nothing, ends the loading state, drops a
pending debounced search and clears the query state.

The debounced `setSearch` timer also ran the query it was armed with. A filter,
object, data-source or page-size change inside the debounce window already
re-ran the query with the typed term; the timer then ran the older query too,
and as the latest call its answer won, so the results shown were for the
previous filter. Now a pending debounced search is dropped when the query
changes. No prop, export or option changes.
