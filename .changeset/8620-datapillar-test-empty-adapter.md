---
---

The suites that render the Data pillar's records grid now give `useAdapter` an
empty-backend `DataSource` instead of `{}` (objectui#8620). `{}` has no `find()`,
so `ListView`'s best-effort fetch `catch` swallowed a `TypeError` and logged it on
every run. A new `failOnAbsorbedFetchError()` pin fails such a suite when a view
absorbs a data-fetch error. Test only. No package is released by this change, and
no existing assertion changed.
