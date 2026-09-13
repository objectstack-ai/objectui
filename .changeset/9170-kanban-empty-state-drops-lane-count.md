---
'@object-ui/plugin-kanban': patch
---

The kanban board's "No cards" announcement drops the lane count from its
description (objectui#9170).

The board-level empty state composed its description by **concatenation**: the
lane count, a space, then the pack's `kanban.columns` unit word, a bare plural
with no singular form. Read from the live region's own `textContent`, a one-lane
board announced `"No cards1 columns"` — and `DataEmptyState` there is
`role="status" aria-live="polite"`, so this is read aloud.

## Why the old string was correct until it wasn't

The bare plural was not a latent bug. The empty state used to require
`boardColumns.length > 1`, so the count in front of `columns` could never be 1
and the plural always agreed with it. objectui#9045 made the region paint at zero
and one lane — that widening **is** the accessibility fix — and the one-lane form
became reachable with it.

## What changed

The description is gone. The live region announces the title only, at every lane
count: zero, one and two lanes all read exactly `"No cards"`. The lane count is
already visible on the board, and read aloud it is noise; the region's job is to
say that the board holds no cards.

⭐ That also makes the bare plural safe **by construction** rather than by a
predicate: there is no number in this region for a plural to have to agree with,
in any language. The alternative considered — a plural family for
`kanban.columns` across ten locale packs — was ruled against.

## What did **not** change

- objectui#9045's predicate is untouched: a zero-lane and a one-lane board still
  announce. Route 3 removes the number, never the announcement, and that is
  pinned as its own case rather than assumed.
- **No published payload moved.** No locale pack was edited, no key was added,
  renamed or retired. `kanban.columns` stays in all ten packs exactly as it was;
  it now has no call site, and `scripts/check-i18n-dead-keys.mjs` — report-only
  by design — is what judges its fate, in its own time and not here.
- The provider-less path needs no separate repair for once: a region with no
  number needs no plural logic, and `createSafeTranslation`'s fallback has none.
