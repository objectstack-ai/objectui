---
'@object-ui/plugin-dashboard': patch
---

The dashboard's `object-data-table` reads its rows once per mount, already expanded, and a dashboard filter re-reads its options when `optionsFrom.filter` changes (objectui#10664).

- `object-data-table` loaded the object definition in an effect of its own and listed it among the fetch effect's dependencies, so every object-bound mount issued two `find` calls, the first without `$expand`. It now reads the definition through `useSettledSchema` from `@object-ui/react` and its query waits until that read settles; a failed read, or an adapter with no `getObjectSchema`, still loads the rows, unexpanded. Its expansion also depends on `columns`, which did not re-run the read: adding a lookup column to a mounted table now re-reads with the new `$expand`, and relabelling a column does not.
- The filter bar's option list sends `optionsFrom.filter` on both of its reads, the dataset query and the record fallback, but did not re-read when only that filter changed. It now does, and an equal filter in a new object does not re-read.
