---
'@object-ui/fields': minor
---

A `datetime` grid cell now honours the same authored `field.format` words a `date` cell already honoured (objectui#8853).

`DateCellRenderer` and `DateTimeCellRenderer` are neighbours reading ONE authored key
and handing it to two formatters with different vocabularies: `formatDate` honours
`'short'` and `'relative'`, `formatDateTime`'s `options.style` honours `'compact'`
alone. So `format: 'relative'` painted the relative face on a `date` column and the
verbose absolute face on a `datetime` one — no error, no warning, no fallback.
Measured end to end through a real `ObjectGrid` column before anything was changed:
one object, one row, one instant (`2026-09-11T09:30:00.000Z`, clock pinned to
`2026-09-09T12:00:00.000Z`, `en-US`), `format: 'relative'` authored on both fields,
the grid's own body cells read

    ["1Open", "Row One", "In 2 days", "Sep 11, 2026, 09:30 AM"]

with the `date` column honouring the key and the `datetime` column beside it dropping
it. After this change the same run reads `["1Open", "Row One", "In 2 days", "In 2
days"]`.

The cell now SELECTS a formatter instead of threading one, the way objectui#8352
already ruled for `formatMeasureDate`'s datetime arm — the same defect class one
surface over:

- `'relative'` resolves through `formatRelativeDate`, the same function the `date`
  cell reaches, so one calendar day reads the same phrase in either column.
- `'short'` resolves to the dense face of this type, which for a `datetime` cell is
  the compact face it already paints — the time of day is kept, and it stays
  byte-identical to an unstyled cell.
- every other string, `'compact'` and date patterns such as `'YYYY-MM-DD'` included,
  falls to the default face exactly as before.

**Behaviour change, spelled out.** Two authored spellings render differently than they
did, and one of them loses a component:

- `format: 'relative'` on a `datetime` field: was the verbose absolute face
  (`Sep 11, 2026, 09:30 AM`), is now the relative phrase (`In 2 days`).
- `format: 'short'` on a `datetime` field: was that same verbose face, is now the
  compact face (`9/11/2026 9:30 am`).
- ⚠️ **Beyond the ±7-day window a `'relative'` datetime now shows no time of day.**
  `formatRelativeDate` falls back to an absolute DATE face out there, so
  `2026-09-20T09:30:00.000Z` renders `Sep 20` where it rendered
  `Sep 20, 2026, 09:30 AM` before. That window belongs to `formatRelativeDate` and is
  inherited rather than re-decided at the call site — re-deciding it would put a
  second copy of the convention in the renderer, which is objectui#4576. `'relative'`
  is day-granular by construction (it shows no time inside the window either), and
  any other fallback would make the two columns unequal again, which is the defect
  being closed.

Note what the delta is and is not: this renderer ignored both words outright before,
so nothing was taken from a working feature — it starts honouring a request whose
granularity is days. It reaches only a `datetime` field whose author actually wrote
one of those two words. An unstyled `datetime` cell, an explicit `'compact'` one, an
authored empty string, and any other spelling all render exactly as they did.

No published signature moved. `formatDateTime(value, options?)` is unchanged and
still ignores `'relative'` and `'short'` in its `options.style` key — threading the
authored word into it would have honoured `'compact'`, the one word the `date` cell
does NOT honour, while still ignoring both words it does, which is the defect
inverted rather than closed. No spelling that rendered before is refused now; adding
a refusal would be a breaking narrowing of a published metadata surface.

`dueLike` is deliberately not threaded and is filed separately as objectui#8958: it
is a different authored key whose affordance travels with red styling and a
field-name heuristic, and acquiring a second key's behaviour while honouring the
first would be an unruled change.
