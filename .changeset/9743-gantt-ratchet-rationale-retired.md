---
---

Retire an unsound justification carried by two pending release declarations, and
leave the decision it justified exactly where it was (objectui#9743).

`.changeset/5903-objectgantt-declared-keys.md` and
`.changeset/6051-gantt-flat-config-declared-keys.md` both explain why the gantt
pair needs no `KnownDrift` entry by crediting the `zod-mirror-parity` ratchet with
a zero-drift reading. When those paragraphs were written the ratchet measured
three directions and was structurally blind to the MIRRORED-but-undeclared one
(objectui#9711, landed by PR objectui#9725), so its zero recorded that it had not
looked in that direction rather than that nothing was there. ⭐ The reasoning was
unsound; the conclusion was not. ⛔ Nothing about the conclusion moves here — no
`KnownDrift` entry is added, no declaration face and no mirror is touched, and
this is deliberately ⛔ not written up as a false sentence being corrected.

What changes in each body is the JUSTIFICATION: it now names the instrument that
does cover the direction. PR objectui#9725 landed the fourth direction together
with a `MirroredUndeclared` ledger that names every mirrored-but-undeclared pair,
and `packages/types/src/__tests__/zod-mirror-parity.test.ts` registers
`objectql.zod.ts#ObjectGanttSchema` in both its mirror map and its declaration
map, so `assertionMirroredUndeclaredMatchesLedger` reconciles that pair on every
run and `assertionNoVacuousMirroredUndeclaredMeasurement` refuses a measurement
that has degenerated to `any`. Each repaired paragraph points at that
reconciliation and dates its own reading rather than writing the answer down —
commandment #9, applied to prose that publishes verbatim at an unknown future
date.

Both bodies keep their frontmatter byte-identical, so neither pending release
declaration is altered; this is the prose-correction shape
`check-changeset-overwrite.mjs` measured as legitimate. This entry declares no
package bump because the change touches `.changeset/*.md` only — measured with
`node scripts/check-changeset-presence.mjs`, which reports no published source
and no published contract in range.
