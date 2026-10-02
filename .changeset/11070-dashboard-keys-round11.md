---
'@object-ui/types': minor
---

The strict authoring face accepts the `layout` that the editable dashboard grid's Save Layout writes onto a `metric-card` in a dashboard's widget slot (objectui#11070, round 11). This widens a published accept set, and it narrows the tolerant face on one corner, stated below.

`DashboardGridLayout`'s Save Layout (`mergeLayoutIntoSchema`) writes `layout: { x, y, w, h }` onto every entry of `widgets[]`, a `metric-card` component node included, and the grid places each entry by it. The widget slot's component-node arm declared no `layout`. The tolerant face kept it through `BaseSchema`'s passthrough, and `StrictAnyComponentSchema` refused it as `unrecognized_keys: ['layout']`, so a dashboard the grid had saved failed on the strict face.

- **What changed.** `DashboardWidgetSlotComponentSchema` declares `layout` on both faces, by reference to `@objectstack/spec`'s widget `layout`, the member the widget arm already carries: the four numbers `x`, `y`, `w` and `h`, and no other key. On the TypeScript face the member is typed `SpecDashboardWidget['layout']`, where it used to be the index signature's `any`.
- **What now refuses that did not.** A malformed `layout` on a component node in the widget slot (a coordinate that is not a number, a missing coordinate, or a key besides the four) was kept unjudged by the tolerant face (`AnyComponentSchema`, `DashboardComponentSchema`). It is now refused there, as it already was on the widget arm. On the TypeScript face such a literal is a compile error. `scripts/measure-strict-authoring-face.mjs`, run over the schema catalog, the docs fences and the apps' authored documents at this change's base and on this change, found no document that writes `layout` on a component node, so no corpus verdict moved.
- **What does not move.** The widget arm, the component node's other keys and the registered-input record objectui#11022 added.

**Fix:** write `layout` as the four numbers Save Layout writes, or leave it out.

`options.description` is not changed by this release. `@objectstack/spec` does not declare it on the widget's `options`, so the strict face keeps refusing an authored one (objectui#11228 ruling C), and its status is an open decision on objectui#11070. Comments in `@object-ui/plugin-dashboard` that called it declared now say so; that package's runtime behaviour is unchanged.

⚠️ **Dated note, 2026-10-02 — the slot arm declares `metric-card`'s registered inputs — objectui#11467.** "The widget arm, the component node's other keys and the registered-input record objectui#11022 added", under "What does not move" above, held when this change landed. Later in this same release, objectui#11467 moved all three. The widget arm's `component` member now takes the slot's component arm first, then `BaseSchema`. The component node declares `title`, `value`, `icon`, `trend` and `trendValue` as members on both faces, so each value is judged by its member. The registered-input record and the strict walker's step that admitted it are retired. `.changeset/11467-metric-card-arm-inputs.md` states what ships; the text above is kept as the reading of this change.
