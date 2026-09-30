---
---

Record the PM's ruling on `object-kanban.quickAdd` (objectui#8201, Q1 = A): the key is a
RULED CARVE-OUT — PREMATURE — rather than a declaration someone still owes.

No published behaviour changes and nothing releases. `OBJECT_KANBAN_INPUTS` is
byte-identical: the key stays undeclared, because publishing it would advertise
configuration the renderer drops. What moves is the console reverse-parity gate's
bookkeeping (the `objectui#8176` backlog ceiling reaches 0, with the ruling recorded as
data rather than prose) and the docblock in `packages/plugin-kanban/src/index.tsx`, which
said the disposition was still with the maintainer. It is not — it was ruled on
2026-09-07, and objectui#8285 owns the fix.

⚠️ **Dated note, 2026-09-29 — the carve-out recorded above was harvested in this same release — objectui#11073.**
Later in this release this repository began resolving `@objectstack/spec` 17.5.0, which carries objectui#8285's ruled retirement: `object-kanban.quickAdd` is now a spec tombstone, refused by name. The exit the ruling named therefore landed. The carve-out's exemption entry was deleted, the ruled carve-out list is empty, and the key is pinned among the gate's tombstones instead. It is no longer a RULED CARVE-OUT awaiting a fix, and `OBJECT_KANBAN_INPUTS` still does not declare it.
