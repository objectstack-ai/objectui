---
---

Test-only: pin that every `AnyComponentSchema` arm is a NAMED export of `@object-ui/types/zod`,
or is ledgered with the reason it is not (objectui#8784). No published source changes, so no
package is released by this change.

objectui#7917 found two arms with no named export on the barrel — `breadcrumb` and
`object-tree` were maintained, were applied by the union, and could not be validated on their
own. PR #8777 repaired both and nothing kept it repaired: `zod-mirror-parity.test.ts` builds
its export population with `/^export const NAME/m`, which matches a DECLARATION and can never
match `export { NAME } from './x.js'`, so it is structurally blind to a missing re-export; no
test pinned a list or a count on `index.zod.ts`; and the one script that does compute the
census, `scripts/measure-strict-authoring-face.mjs`, is a self-described MEASUREMENT THROWAWAY
wired into no `package.json` script and no workflow.

The pin derives the arm list on every run — flatten the union recursively through nested
unions and `z.lazy`, then match each leaf arm to a named export **by identity**. Both
properties are load-bearing and both are controls in the file rather than claims in a comment:
a walk that stops at the 13 top-level members — 12 sub-unions plus one object arm
(`AppComponentSchema`, an arm at depth 1), not 13 sub-unions — scores exactly
`options.length` arms, and a
name-based match is satisfied by `export { NavigationSchema as BreadcrumbSchema }` — the
parent sub-union under the arm's name, which passes every behavioural leg of #8777's pin. No
count is hard-coded; the only bound asserted against the real union is a floor read off that
union's own top-level option count.

Red on arrival, reported rather than declared away: `507b61bf7` (PR #8763, objectui#8499)
armed `SemanticElementSchema`, `HtmlElementSchema`, `InputShorthandSchema` and
`UiCalendarSchema` in `layout.zod.ts` and `form.zod.ts` and touched no barrel deliberately
(PR #8763 merged 2026-09-09T08:11:20Z; the omission and its reason are declared in
`.changeset/8499-node-slot-registered-arms.md`). The
current reading is 111 arms / 154 `type` literals / 106 named / 5 unnamed. Four of the five
carry ledger rows against objectui#9067, which holds the ruling, because exporting them mints
new names on a published surface. The fifth, `RetiredKanbanNodeSchema`, is a refusal arm the
barrel already declares deliberately internal (objectui#8802). A stale-row leg deletes any
ledger row the moment its arm is exported or stops existing.
