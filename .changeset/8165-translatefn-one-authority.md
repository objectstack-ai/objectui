---
---

At this change, re-point `saveAdvisoryToast`'s `TranslateFn` at its one
authority, `writeWarningToast` (objectui#8165), and shrink the
`KNOWN_COLLISIONS` baseline in
`scripts/__tests__/one-authority-per-exported-name-6273.test.ts` by that site.
Type-level only: the declaration was byte-identical to the one it re-exported,
at this change the name was on no package's published face, and
`export type { X } from '…'` erases at build — so no package is released by
this change.

⚠️ **Dated note, 2026-09-25 — the one authority has since moved to
`@object-ui/i18n` — objectui#8261.** Later in this same release `TranslateFn` is
declared once in `@object-ui/i18n` and published from that package's entry;
app-shell's toast modules and `@object-ui/fields`' `file-size-guard` re-export
it from there, and the `KNOWN_COLLISIONS` entry is gone. The rest of this
entry is kept as the reading of this change; the objectui#8261 entry states
what ships.
