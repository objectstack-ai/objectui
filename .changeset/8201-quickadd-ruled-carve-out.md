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
