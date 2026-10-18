---
"@object-ui/types": minor
"@object-ui/cli": minor
"@object-ui/core": minor
"@object-ui/sdui-parser": minor
"@object-ui/components": minor
---

**Clause-②: yes (narrowing)**

One declaration of the per-type NODE SLOTS — the keys other than `children` through which a renderer hands authored nodes back to `SchemaRenderer` — and three readers that walk it instead of stopping at `children` (objectui#11170, the follow-up PR #11126's Acceptance notes filed).

New on `@object-ui/types`, beside `BaseSchema.children`: `NODE_SLOT_DECLARATIONS` (one row per renderer, under every registry spelling that resolves to it), `nodeSlotsFor(type)`, `nodeSlotPathSegments(path)` and `nodeSlotValues(node, path)`, with the types `NodeSlotDeclaration`, `NodeSlotRow`, `NodeSlotSegment` and `NodeSlotValue`. A position is spelled as a key path — `trigger`, `items[].content`, `regions[].components`, `items[]`, `report.sections[].content` — and the value at its end is one node or a list of nodes. The `page:*` rows are `@objectstack/spec`'s `pageComponentSlotPositions()` placed on the type whose renderer reads each position, pinned against that export in both directions; every other row is objectui's own, pinned against the live renderer. `body` stays retired as the generic child-list key (objectui#6771): it appears only on the four `page:*` types whose renderer still paints it for stored documents, marked `retired`.

Accept sets that narrow, each reader FROM → TO:

- `@object-ui/cli` — `objectui check`'s unevaluated-expression refusal (`findUnbindableTextExpressions`). FROM: the document root and every node its `children` hold. TO: those, and every node under a slot its type declares — so a `${…}` on `title` / `label` / `value` / `description` of a node under a dialog's `content`, a tab item's `content`, a page's `regions[].components`, a carousel item, a detail view's `tabs[].content` is now refused with the slot path (`items → 0 → content → value`). The false-refusal rows of PR #11126's ablation 2 stay green: a form's `fields[]`, a grid's `columns[]` and `{ "type": "multiple" }` are not slots. Measured over this repository's own JSON corpus and docs fences: no new finding.
- `@object-ui/core` — `validateSchema`. FROM: `validateChildren` recursed through `children` only. TO: it also recurses through the declared slots, so an invalid node under one (a retired `crud` spelling under `dialog.content`, an `INVALID_SCHEMA` member) is reported with its own path, spelled as `schema.items[0].content`. Measured over the same corpus: no new finding.
- `@object-ui/sdui-parser` — `validateTree`. FROM: the walk descended `children` alone, and a manifest entry carried no slot. TO: `ManifestComponent` gains `slots?: readonly string[]`, `manifestFromConfigs` gains `opts.slotsFor` (hand it `nodeSlotsFor`) and projects each entry's non-retired positions, and `validateTree` descends them — an unknown component, an unknown or mis-typed prop or an illegal enum under a slot now draws its diagnostic. A manifest built without the option serialises byte-identically and keeps the `children`-only reach. The `RETIRED_CHILD_LIST_KEY` refusals are unchanged.
- `@object-ui/components` — the `kind:'html'` page's compile manifest (`getJsxManifest`) is built with `slotsFor`, so an html-tier page whose slot-held node fails validation now fails to compile the way one under `children` does. Narrowing: a page that compiled with an unknown tag under a `dialog`'s `content` no longer does.

Docs: `content/docs/utilities/cli.mdx`'s "Component nodes only" rule, the gate's own docblock, `validateChildren`'s comment and the parser's header now say the walk follows `children` and the declared slots; the declaration's header is where the slot list is explained.
