---
"@object-ui/react": patch
---

**A node-gate predicate parked under `props` is now REFUSED BY NAME on the console, instead of gating nothing in silence (objectui#9108).**

A node may spell its config bag `properties` (the spec spelling) or `props` (the annotated legacy alias). `SchemaRenderer` hoists `properties.*` onto the node; nothing copies `props.*`, and both node gates read the post-hoist node — so a predicate that arrived under the alias was never one of the keys either gate could see. Measured at node level, four rows: `props: { visible: false }` and `props: { hidden: true }` both RENDERED, while `properties: { visible: false }` and `properties: { hidden: true }` each hid correctly. Fail-**open** and silent by construction: a gate that never bit renders exactly like a gate that said yes, so no user and no screenshot can find it.

**No verdict moves, and that is the ruled outcome rather than a limitation.** The alias is refused, ⛔ not honoured: nothing is hoisted, `schema.<KEY>` stays undefined for a renderer declared as `({ schema })`, and every element receives the byte-identical props bag it received before. What changes is that the eight node-gate predicate keys (`visibleWhen` / `visible` / `visibleOn` / `visibility` / `hidden` / `hiddenOn` / `disabled` / `disabledOn`) are named on the console when they are parked there, with the migration that fixes them. The maintainer ruling of 2026-09-13 closed the honour arm (PR objectui#9144) on the ground that honouring the alias would have made *"8 predicate keys work while the rest stayed silently dropped — and partly working is harder to learn from than not working"*.

The line is `console.error`, in development **and in production** — the same posture objectui#6038 gave the unresolvable-predicate report, because a node gate that has stopped biting in production is exactly the defect that must not be able to sit live and undiscovered. It is rate-limited to one line per distinct authoring bug for the lifetime of the page. One measured carve-out: `disabled` on a bag-reading `element:*` node is honoured by that renderer itself (`disabled={props.disabled || running}`), so it is not refused there.
