---
'@object-ui/types': minor
---

`flex`, `object-grid` and `object-chart` accept the node-level `responsiveStyles` that `@objectstack/spec`'s `PageComponentSchema` declares on every page component, and judge it as the spec does (objectui#10872, batch 9).

**Clause-②: yes (widening)**: the strict authoring face (`StrictAnyComponentSchema`) now accepts a node-level `responsiveStyles` on `FlexSchema`, `ObjectGridSchema` and `ObjectChartSchema`, where it refused the key by name. Batch 8 declared the same key on the 30 public-block arms; these are the three arms outside that set whose nodes the objectstack showcase and UI skill write it on.

**What changed, in observable terms.**

- The three arms declare `responsiveStyles` from the same shared declaration as the public-block arms: the spec's `ResponsiveStylesSchema`, by reference. Its breakpoints (`large`, `medium`, `small`, `xsmall`), its strictness and its unknown-breakpoint message come from the spec.
- A node such as `{ "type": "flex", "direction": "col", "responsiveStyles": { "large": { "display": "block", "minWidth": "0" }, "small": { "padding": "12px" } } }` parses on both faces, and the map comes back unchanged. The same holds for `object-grid` and `object-chart` nodes.
- The published TypeScript interfaces `FlexSchema`, `ObjectGridSchema` and `ObjectChartSchema` declare `responsiveStyles?: ResponsiveStyles`, the spec's type. Before, the key was typed `any` through `BaseSchema`'s index signature.
- Nothing else widens. `BaseSchema` still does not declare `responsiveStyles`, and neither does any other arm (`stack`, `grid` and `container` included), so the strict face still refuses it there by name. The other node-level keys the spec declares (`events`, `aria`, `visibility`, `responsive`, and `dataSource` on `flex` and `object-chart`) stay undeclared.

**Narrowing, on already-published arms.** Unlike the public-block arms, these three were published before this change, and two things now refuse what used to pass:

- The tolerant face (`safeValidateSchema`, the face `objectui validate` runs) used to keep any node-level `responsiveStyles` value on these arms unjudged. It now refuses a value the spec refuses, at `responsiveStyles`, with the spec's own issue: a breakpoint the spec does not have (`md`), a number instead of a map, or a style value that is neither a string nor a number. `SchemaRenderer` applied nothing for a number or for a map with no spec breakpoint. It emitted a non-CSS value inside a valid breakpoint verbatim, where the browser dropped it, and it applied the valid breakpoints of a mixed map.
- In TypeScript, a `responsiveStyles` value that is not the spec's `ResponsiveStyles` no longer type-checks on these three interfaces.
- An `object-view`'s `table` slot, which takes `ObjectGridSchema`'s members, does not gain the key. `ObjectView` draws its grid as a component, not as a schema node, so nothing compiles a `responsiveStyles` map written in `table`. The slot therefore refuses `table.responsiveStyles` by name, with that reason, on both faces, as it refuses the other node-level keys (objectui#10976). The tolerant face used to keep it unjudged, and the TypeScript slot never declared it.
