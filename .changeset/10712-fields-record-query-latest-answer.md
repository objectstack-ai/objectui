---
'@object-ui/fields': patch
---

fix(fields): `useRecordQuery` shows the answer to its latest query when an earlier answer lands late (objectui#10712, objectui#10713)

`useRecordQuery`, the query kernel behind `LookupField`, the people picker and
`RecordPickerDialog`, runs a query when the page, sort or filter changes, when
the debounced search fires, and on `refetch`. A later query can start while an
earlier one is still in flight. Every answer was committed, and every query
ended the loading state when it settled. So an earlier query's answer that
landed last replaced the current results (a user who typed or filtered faster
than the server answered saw the results for an earlier term), and one that
landed first ended the loading state while the current query was still
pending.

Now only the latest query commits its records, total or error, and only it ends
the loading state. No prop, export or option changes.
