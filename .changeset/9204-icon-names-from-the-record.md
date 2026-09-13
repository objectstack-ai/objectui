---
'@object-ui/components': minor
'@object-ui/app-shell': minor
'@object-ui/console': minor
---

Icon-name membership answers from lucide's `icons` record, and a retired
spelling is refused instead of silently degraded (objectui#9204).

⚠️ **Behaviour change, on purpose.** lucide publishes two icon vocabularies: the
runtime `icons` record it actually ships, and the larger dynamic-import list
that still carries spellings lucide has retired. `getLazyIcon`, `LazyIcon` and
`isLucideIconName` used to judge names against the second one; they now judge
against the record, which is what every other resolver in this package already
read. Measured against the installed lucide, that retires **254 spellings** —
`smile`, `edit`, `filter`, `alert-triangle`, `sort-desc` and the rest.

- **A retired spelling is now REFUSED OUT LOUD.** It used to become the
  `Database` glyph (or, through `isLucideIconName`, a notification's severity
  icon) with nothing logged — a page that still rendered and a glyph that looked
  deliberate. The console now carries a diagnostic, once per spelling, naming
  the spelling, lucide's current name for it, and the exact spelling to write
  instead. Both halves are derived from the installed lucide at runtime; there
  is no list of retired names in this repo to go stale.
- **`isLucideIconName` keeps its signature and its synchronous contract.** Only
  the vocabulary behind it moved. Spellings the two lists agree on — kebab-case,
  snake_case, space-separated and PascalCase alike — resolve exactly as before.
- **New export `loadLucideIconNames()`** — the renderable icon vocabulary,
  `Promise`-returning, for a picker that needs the whole list to search. The
  metadata designer's icon picker loads it when it opens.

**Why:** importing the icon NAMES imports lucide's dynamic-import map with them,
because lucide derives the names as that map's keys. Four modules did, and the
map sat in the console's eager `ui-components` chunk on every page load. Sourcing
membership from the record — which the same chunk already carries — takes
**8,596 gzipped bytes** off that chunk and **8,637** off the whole eager closure,
measured on two console builds in one container. The `ui-components` row goes
from 1,910 B of headroom (0.02x, red) to 10,506 B (0.12x, green), which pays off
the declared allowance that row has been carrying.
