---
'@object-ui/types': minor
---

**Breaking for authored metadata:** a `filter-builder` CONDITION must now declare
`id` (objectui#8415). It is declared on both published faces — the TypeScript
interface `FilterBuilderCondition` in `complex.ts` and the Zod mirror
`FilterBuilderConditionSchema` in `zod/complex.zod.ts` — so a key the renderer
has always required is finally validated instead of silently discarded.

**What was measured, on this branch's base (`0203a29e`).** The mirror declared a
condition as `{ field, operator, value? }` and it is a plain `z.object`, which
STRIPS undeclared keys. So an author who correctly wrote `id` had it removed:
`FilterBuilderConditionSchema.safeParse({ id: 'c1', field, operator, value })`
returned `success: true` with an output whose keys were `field`, `operator`,
`value` — no `id`. The document then validated and the row rendered, and from
that point on the row had no individual identity: every affordance on it is
handed `undefined`, so it acts on every OTHER id-less row along with it. The
measurement is below.

Re-derived from `packages/components/src/custom/filter-builder.tsx` rather than
inherited, and stated as a property rather than as a tally of read sites, since
that file keeps gaining `condition.id` reads and a count goes stale with the next
one: **which row an edit lands on is decided by `id` and by nothing else.** Each
mutator that acts on a single row picks it with a MATCH on `id`
(`removeCondition`'s `c.id !== conditionId`, `updateCondition`'s and
`changeOperator`'s `c.id === conditionId`, `changeField`'s
`c.id !== conditionId`), every call to one of them hands it `condition.id`, the
row's React `key` is `condition.id`, and nothing in the file matches a row by its
index. The file's other reads of `condition.id` pick no row; one of them builds
the element id that a half-filled range's blank bound names in
`aria-describedby`. The MATCH sites and the `key` are re-derived from the
component source by the `re-derived from the reader` block of
`packages/types/src/__tests__/filter-builder-condition-id-8415.test.ts`; the
rest of the property is read off the source, and no test pins it.

**What that does when `id` is stripped**, simulated on the four helper bodies
transcribed verbatim, over three id-less rows and one `crypto.randomUUID()` row
(the realistic mix: the mirror strips every AUTHORED row's `id`, while rows the
user adds in-session are born with one). Both sides of every comparison are
`undefined`, and `undefined === undefined` is TRUE, so each helper matches EVERY
id-less row rather than none:

- `removeCondition(undefined)` keeps only rows where `c.id !== undefined`, so it
  deletes all three id-less rows in a single click — the clicked one included —
  and leaves the uuid row standing. Measured: 3 of 4 rows removed.
- `updateCondition(undefined, …)`, `changeOperator(undefined, …)` and
  `changeField(undefined, …)` each apply the edit to all three at once.
  Measured: 3 of 4 rows moved, each time.
- `key={condition.id}` becomes `key={undefined}`, which React reads as NO key at
  all rather than as a duplicate one. Measured on React 19.2.8: `element.key` is
  `null` for every such row, the list falls back to index reconciliation, and
  React logs `Each child in a list should have a unique "key" prop.`

So the defect is **loss of individual identity** — every affordance acts on all
the id-less rows en bloc, and a row cannot be edited or removed on its own. It
is not "matches none", and it is the more severe of the two readings. The
component's own exported `FilterBuilderCondition` has always declared
`id: string`, and `addCondition` emits `crypto.randomUUID()`.

**Who is affected — a condition authored without `id`:**

```json
{ "type": "filter-builder", "name": "f",
  "fields": [{ "value": "a", "label": "A", "type": "text" }],
  "value": { "id": "root", "logic": "and",
             "conditions": [{ "field": "a", "operator": "equals", "value": "x" }] } }
```

now fails validation. **Where it is REPORTED is not where it logically is.**
`value.conditions.0.id` is the LOGICAL location — the concatenation of the paths
down the arm tree. The issue `safeValidateSchema` actually reports is a single
`invalid_union` at `path: ["value"]`. The document-level union is discriminated
on `type` (objectui#8498), so it hands back the `filter-builder` schema's own
issues instead of nesting them under a root union. The `id` failure sits inside
two nested unions: that `invalid_union` → arm 1 (`FilterGroupSchema`) →
`invalid_union` at `["conditions", 0]` → arm 0 (`FilterBuilderConditionSchema`)
→ `invalid_type` at `["id"]`,
*"Invalid input: expected string, received undefined"*. Parsed against
`FilterBuilderConditionSchema` directly, the same refusal is reported flat, at
`path: ["id"]`. Both are stated because a consumer that reads `issue.path` off
the document-level result will not find `id` there.

**The compile-time face, which lands before any document is parsed.** `id` is
declared on the TypeScript interface as well, so a TypeScript author is refused
by `tsc`, not only by the validator. An object literal typed
`FilterBuilderCondition`, or `FilterGroup['conditions'][number]`, or a condition
written inside a `FilterGroup` / `FilterBuilderSchema['value']` / `defaultValue`
literal, now fails type-check with *"Property 'id' is missing in type … but
required in type 'FilterBuilderCondition'"* — measured on all four spellings.
The GROUP's own `id` stays optional, so `{ logic: 'and', conditions: [] }` still
compiles. Stated explicitly for the reason objectui#7774 stated its compile-time
face (`groupField?: never`, "refused at compile time"): it is the half a
TypeScript author meets first, and a runtime-only description hides it.

**Migration:** give each condition a stable unique string — any value the rest of
the document does not reuse; the component generates `crypto.randomUUID()` for
rows the user adds.

⭐ **The narrowing refuses only what was ALREADY broken.** A condition with no
`id` renders today but cannot be edited or removed INDIVIDUALLY — as measured
above, one click removes every id-less row at once and one edit fans out across
all of them — so nothing that works stops working; the state this refuses is
*accepted-and-discarded*, the class objectui#6150 closed for `tree-view.title`.
Measured across `apps/**`, `examples/**`, `content/**` and `packages/**`:
**every** authored `filter-builder` condition in this repository already carries
`id` — 7 of 7, across the three schema-catalog entries that author rows — so no
shipped document in this repo changes verdict on this key.

**What else now refuses, and it is the second thing declaring a key buys:**
`id: 42`. An UNDECLARED key gets no type check at all, so a wrong-typed identity
parsed clean at base and was then dropped. It is now refused — reported flat at
`path: ["id"]` on the condition schema (*"Invalid input: expected string,
received number"*), and through the document at the same place in the arm tree
as the missing key above.

**Who is NOT affected.** ⛔ The GROUP's `id` is untouched and stays OPTIONAL
(objectui#7560): `isValidGroup` never consults it, nothing reads
`filterGroup.id`, and deleting it from an authored group renders
byte-identically — the opposite reading, on a member that looks identical.
`{ logic: 'and', conditions: [] }` still validates. The renderer is unchanged;
`FilterOperatorSchema`, `FilterFieldSchema` and `FilterBuilderSchema`'s own keys
are byte-identical, so the three items parked on objectui#7562 and the operator
vocabulary of objectui#7561 are neither addressed nor moved here.

Graded `minor`, not `patch`: this narrows the accepted input set, which is
breaking for any author who wrote a condition without an identity. It is not
`major` per this repo's fixed-group convention (objectui's own breaking changes
ship as `minor`; the group's major tracks `@objectstack` — AGENTS.md 版本号策略,
mechanically enforced by `scripts/check-changeset-no-major.mjs`).
