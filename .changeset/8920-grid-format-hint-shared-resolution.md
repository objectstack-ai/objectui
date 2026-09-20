---
"@object-ui/plugin-grid": patch
---

fix(plugin-grid): honour a column's `format` hint on every `ObjectGrid` render path

`@object-ui/fields` publishes a two-step resolve — `getCellRenderer(resolveCellRendererType(field))` — because a textual base type carrying a `format` hint (`phone`, `email`, `url`, `currency`, `percent`) maps to a richer renderer than its declared type does. `ObjectGrid` spelled that resolve six times with three conventions, and four of them passed the declared type straight to `getCellRenderer`. On those paths a `text` + `format: 'phone'` column silently fell back to plain truncated text: no error, no warning, no `tel:` link.

All six sites now route through one module that owns "declared type + format hint -> renderer", so a hinted column renders the same way whether its columns were declared as objects, as strings, derived from an authored `fields` projection, derived from the object schema, or read in the record-detail panel. Numeric alignment and the header type icon follow the same resolved renderer key on every path, while the type forwarded to the inline editor stays the declared one — a hinted text column still edits as text.
