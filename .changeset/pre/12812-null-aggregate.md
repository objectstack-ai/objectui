---
'@object-ui/data-objectstack': patch
---

`aggregate()` no longer reads a served `null` measure as a missing one. The analytics answer's `null` (the max or min over rows whose field is all NULL) now reaches the caller as `null` from the single analytics request; only a measure key that is absent from the answer falls back to re-reading the rows through `find()`. This removes a second, row-reading request from every widget bound to such an aggregate.
