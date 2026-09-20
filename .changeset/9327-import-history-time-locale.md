---
"@object-ui/plugin-grid": patch
---

The import-job history table formats its timestamps in the tenant's locale, not the machine's

`formatImportJobTime`, which draws the Time column of the grid's import-job history
panel, ended in a bare `d.toLocaleString()`. An omitted tag does not mean "the user's
locale" — it means the MACHINE's, which is neither of this renderer's two locale
channels, and on a date that moves the FIELD ORDER rather than a separator: the same
instant reads as `04/03/2026` under `en-GB` and `3/4/2026` under `en-US`, both legal and
mutually ambiguous for the first twelve days of every month. An import-history row is
exactly where a reader works out which run was which, and there is no unit marker to
catch the misreading. Measured before the fix: a German session rendered the status badge
as `Erfolgreich` and the timestamp beside it in the machine's American order.

`ImportHistoryPanel` now reads `useDisplayLocale()` at component level — the same channel
every other date, number and currency renderer in this repo goes through — and hands the
resolved tag to the helper. The helper stays a module-level pure function rather than
being inlined into the component, and its `locale` parameter is a REQUIRED, non-optional
`string`: under an optional spelling a caller could drop the argument, still type-check,
and render a plausible date instead of an error. There is no renderer-side `?? 'en'`
backstop; `useDisplayLocale` already owns the last resort and always returns a concrete
tag.

No published symbol moves — both the helper and the panel are module-private. Behaviour is
byte-identical wherever the resolved tag already agreed with the machine.
