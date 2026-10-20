---
'@object-ui/components': patch
---

A `kind:'react'` page keeps its own state when its host re-renders (objectui#13268). The page was recompiled whenever it received a new schema object, and the console hands it a fresh copy of the page on every render, so a re-render remounted the page: a selected record reset and an open drawer closed. The page now recompiles only when its content changes (its `source`, its `data` / `variables`, or any other page value it can read) or the adapter does. A changed source or value still recompiles and resets the page, as before.
