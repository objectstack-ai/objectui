---
"@object-ui/plugin-calendar": patch
---

fix(plugin-calendar): the month gridcell's accessible name follows the resolved locale

`MonthView`'s day gridcell built its `aria-label` with
`toLocaleDateString("default", …)` — the literal `"default"` means the *machine's*
locale — while the weekday column headers one row above were already formatted with
the component's resolved `locale`. A screen-reader user on a non-`en` session
therefore heard the column headers in their own language and every date in whatever
locale the runtime happened to be set to.

Both branches of that label (with events and without) now use the same resolved
`locale` the headers use. No locale pack, key or translation is involved — this is
which tag the `Intl` call is handed.
