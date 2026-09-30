---
'@object-ui/core': minor
'@object-ui/types': minor
'@object-ui/fields': patch
'@object-ui/plugin-grid': patch
'@object-ui/plugin-detail': patch
'@object-ui/plugin-list': patch
---

A number field's authored `useGrouping` now decides whether its value renders with thousands
separators (objectui#11026). This is the renderer half of `FieldSchema.useGrouping`, the
digit-grouping hint `@objectstack/spec` declares on a field.

**What an author now controls.** Write `useGrouping` on a `number` field:

- `useGrouping: false` renders the value with no separators, whatever its `scale`: a
  `scale: 2` code field reads `12345.50`, not `12,345.50`.
- `useGrouping: true` groups it, even at `scale: 0`: a scale-0 headcount reads `2,026`, not
  `2026`. An authored `true` reaches `Intl.NumberFormat` as `useGrouping: true`, which means
  "always". So in a locale that leaves a four-digit number alone by default (es-ES, pl-PL),
  `1234` renders `1.234` / `1 234`.
- Leave it out and nothing changes: a declared `scale: 0` still reads as an ordinal and renders
  ungrouped (a year reads `2026`), and any other number is grouped the locale's way.

Before this change nothing in the console read the key, so the only way to drop the separators
was `scale: 0`, and there was no way to keep them on a scale-0 count.

**Where it applies.** List and grid cells, record detail sections and highlights, the record
quick-look panel, related-record tables and gallery cards. Each of these builds a cell's field
from the object's field definition key by key, and each now copies `useGrouping` next to
`scale`. Kanban cards and the grid's auto-generated columns hand the cell the whole field
definition, so they follow it too. The form's number input and the dashboard's record table
read neither `scale` nor `useGrouping` for grouping, and are unchanged.

**API (additive).**

- `@object-ui/core`: `DisplayNumberFormatOptions` gains `useGrouping?: boolean`, and
  `shouldGroupDisplayNumber` takes it as an optional third parameter. An authored boolean
  answers first; with it unset, the existing `scale`/`currency` rules decide as before.
  `@object-ui/i18n` re-exports both names, so the same options reach it too.
- `@object-ui/types`: `NumberFieldMetadata` declares `useGrouping`, typed from the spec's
  `FieldSchema.useGrouping`.
