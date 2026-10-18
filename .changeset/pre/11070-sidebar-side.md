---
'@object-ui/types': minor
---

The `sidebar` node declares `side` on both faces, so the strict authoring face accepts the edge the sidebar is drawn against (objectui#11070).

`side` is `'left'` (the default) or `'right'`. These are the two values the `sidebar` registration offers, and the edge shadcn's `Sidebar` pins the collapsible form to. The node hands the key to shadcn through the props it forwards, so it always drew; only the declaration was missing. `@objectstack/spec` has no `sidebar` row to take it from, so it is declared locally.

- **TypeScript.** `SidebarSchema` gains `side?: 'left' | 'right'`. A typed literal carrying `side: 'right'` used to be refused as an excess property, and now compiles.
- **zod (`@object-ui/types/zod`).** WIDENS on the strict authoring face (`StrictAnyComponentSchema`): `side` used to be refused with `unrecognized_keys`, and now parses. NARROWS on the tolerant face (`safeValidateSchema`, which `objectui validate` runs): a `side` other than the two edges used to parse unjudged, and is now refused with `invalid_value` at `side`. Nothing changes for `left` or `right`.
- **The retired `position` key.** It stays refused by name on every face. Its refusal now also says that `side: 'right'` draws the sidebar against the right edge.

BREAKING (`@object-ui/types`), for a document whose `sidebar` node carries a `side` that is neither `left` nor `right`: it no longer validates. Write `left` or `right`. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

**Clause-②: yes (widening)**: `side` widens the strict face, and its two-value enum narrows the tolerant face.
