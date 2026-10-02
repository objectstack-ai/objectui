---
'@object-ui/types': minor
---

feat(types): an authored `flex` takes its props in the spec's `properties` bag; the flat spelling is refused by name (objectui#11276)

**BREAKING (authoring):** a `flex` node that writes `direction`, `justify`, `align`, `gap`, `wrap` or its child list `children` on the node itself is now refused by `safeValidateSchema`, `validateSchema` and the strict authoring face, and so by `objectui validate`. Move each of them, the child list included, into the node's `properties` bag:

```json
{ "type": "flex", "className": "p-4", "properties": { "direction": "col", "gap": 4, "children": [{ "type": "text", "content": "First" }] } }
```

`id`, `className`, `style`, `visible` and the other base props, and the node-level `responsiveStyles`, stay on the node. Nothing changes at render time: `SchemaRenderer` hoists every `properties` key onto the node before the `flex` renderer runs, so the bag node draws what the flat one drew, and a stored flat node, or a node built in code, keeps rendering with its flat keys. In TypeScript, `FlexLayoutProps` is the bag's type: check an authored bag with `satisfies FlexLayoutProps`.

**Clause-②: yes** — the accept set narrows (a flat `flex` node that parsed is refused) and widens (a spec-shaped bag node that the strict face refused parses). Released as `minor` under the objectui narrowing rule, with this banner.

**Why.** `@objectstack/spec`'s strict `PageComponentSchema` refuses a prop written on a page component itself as mis-layered (ADR-0089 D3a), for every component type, and the maintainer ruled A on objectui#11300: the `properties` bag is the contract on `flex` too. The arm here was the flat mirror of the TypeScript `FlexSchema`, so the two validators disagreed both ways: the strict face refused the objectstack showcase's layout boxes, written in the bag, and both faces accepted the flat node `os validate` refuses. objectui#6751's guidance that `flex` declares its keys on the node is withdrawn for `flex` only; `stack` and every other layout arm keep their props on the node.

**What changed, in observable terms.**

- `@object-ui/types/zod` exports `FlexBlockSchema`, built the way `ObjectChartBlockSchema` is: `BaseSchema`, the `flex` literal, the node-level `responsiveStyles`, and `properties`. `@objectstack/spec` has no `ComponentPropsMap['flex']` row, so the bag's `direction`, `justify`, `align`, `gap` and `wrap` are the flat `FlexSchema` mirror's own members: their values are judged exactly as before, now in the bag. A key `flex` does not declare stays unjudged in the bag by the tolerant face and is refused there by the strict face, as it was on the node.
- The child list is `properties.children`: one node or a list. Each component in the list is judged once, at its own path (`properties.children.0…`), by the same page walk that judges a `page:` container's child list.
- Each of the six props written flat on the node is refused on both faces, with a message that names its bag member (`Did you mean \`gap\` → \`properties.gap\`?`). `body` is refused toward `properties.children`.
- `FlexBlockSchema` is the `flex` arm of `AnyComponentSchema`. `FlexSchema` leaves the union.

**The same release's changesets** that describe what the validators say about a `flex` written flat — `.changeset/10872-flat-arm-responsive-styles.md` (its example node writes `direction` flat), `.changeset/6751-flex-props-envelope-lift.md` (the keys lifted onto the node), `.changeset/8284-content-channel-per-component.md` (`body` refused toward `children`) and the remedy example in `.changeset/7926-page-node-refuses-actions.md` — describe the flat mirror, which still behaves as they say. On an authored node the props now live in the bag: `responsiveStyles` stays on the node as `.changeset/10872-flat-arm-responsive-styles.md` says, and its value checks hold there; the other props, the child list included, move into `properties`.

**What did not move.** The TypeScript `FlexSchema` and its zod mirror `FlexSchema` stay published and unchanged in shape. They are the node as the `flex` renderer reads it after the hoist, and as code composes it.
