---
---

Test-only (objectui#9711). `zod-mirror-parity.test.ts` gains a FOURTH direction —
`MirroredUndeclaredKeys`, which reports a key the zod mirror declares and the
TypeScript twin does not — together with its seeded `MirroredUndeclared` ledger, a
four-way recognition pin on one synthetic pair, and a census that enumerates and
sizes the seed at test time. No published behaviour changes: the file is excluded
from this package's build (`tsconfig.json`), so nothing it adds reaches `dist`,
which is the whole of this package's `files` list. No declaration and no mirror
moved — the direction is the INSTRUMENT, and remedying what it reports would
enlarge a published accept set, which is a separate decision.
