---
'@object-ui/types': minor
'@object-ui/plugin-gantt': minor
---

`ObjectGanttSchema` declares the ten gantt keys `ObjectGantt` actually reads
(objectui#5903, triage 2026-08-24). Every one is a real, working, documented
feature — `readOnly`, `mobileReadOnly`, `markers`, `navigation`, `skipWeekends`,
`holidays`, `criticalPath`, `showBaselines`, `persistLayout`, `viewName` — and
none of them was discoverable from the published type, because all ten were read
as `(schema as any).K`. The cast was the load-bearing part: it kept the read
invisible to `tsc`, to the zod mirror and to the designer's registry `inputs`.

Both halves move together. The TS declaration (`packages/types/src/objectql.ts`)
and its zod mirror (`src/zod/objectql.zod.ts`) gain the same ten keys at the same
requiredness — all optional — and no `KnownDrift` entry is added. `navigation` is
taken from `@objectstack/spec`'s `NavigationConfigSchema` by reference rather than
restated, matching `ObjectGridSchema.navigation`.

⚠️ **The JUSTIFICATION for that parity clause was retired (objectui#9743); the
clause itself stands and did not move.** As first written it credited the
`zod-mirror-parity` ratchet with a zero-drift reading for this pair — but at that
time the ratchet measured three directions and was structurally blind to the
MIRRORED-but-undeclared one (objectui#9711), so a zero from it recorded that it
had not looked in that direction, not that nothing was there. objectui#9725
landed the fourth direction, and it covers this pair BY NAME:
`packages/types/src/__tests__/zod-mirror-parity.test.ts` registers
`objectql.zod.ts#ObjectGanttSchema` in both its mirror map and its declaration
map; `assertionMirroredUndeclaredMatchesLedger` requires every registered pair's
mirrored-but-undeclared key set to equal that pair's `MirroredUndeclared` ledger
entry — `never` for a pair the ledger does not name — and
`assertionNoVacuousMirroredUndeclaredMeasurement` refuses a measurement that has
degenerated to `any`. ⛔ Read this pair's verdict off that reconciliation, which
re-derives it on every run, rather than off any figure written here; when this
paragraph was authored, on 2026-09-18, it required no `MirroredUndeclared` entry
for the pair.

`ObjectGanttProps.schema` is retyped from `ObjectGridSchema` to
`ObjectGanttSchema`. That is what makes the declaration load-bearing: the ten
keys are not grid keys, so with the old prop type, dropping the casts would have
left the reads landing on `BaseSchema`'s index signature — the same invisibility
in different syntax. The grid-style `{ gantt: { … } }` block is unaffected;
`getGanttConfig` reads it through that index signature exactly as before, and the
registered renderer passes `schema: any`, so no runtime shape is turned away.

Accept-set change, stated plainly: a **declared** key is now type-validated, so
`readOnly: 'yes'` is refused where it used to parse green — the same narrowing
objectui#5074 landed for `viewMode`. An **undeclared** key is still accepted:
`BaseSchema` is `.passthrough()` and carries an index signature (objectui#5155's
structural ceiling), so declaring these ten did not buy rejection of a
misspelling. `packages/types/src/__tests__/gantt-declared-keys.test.ts` pins both
halves so neither can be misread.

The eleventh reported key, `label`, needed no declaration — `BaseSchema` already
carries it — so only its cast was dropped.
