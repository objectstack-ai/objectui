---
'@object-ui/types': minor
'@object-ui/components': minor
'@object-ui/core': minor
'@object-ui/sdui-parser': minor
'@object-ui/cli': minor
'@object-ui/app-shell': minor
'object-ui': minor
---

**BREAKING (authoring surface): `body` is no longer a child-list key. Author `children`.**

`BaseSchema` declared two spellings of one concept — `body` and `children` — and left the
choice per component. **Thirteen** registrations read `body` and nothing else, so it was
their ONLY door — the twelve the ruling enumerated plus `tooltip`, which it did not, and
which is the count the committed instrument carries (`BODY_ONLY` plus
`BODY_ONLY_UNRULED` in `scripts/body-dialect-census.mjs`). `div`, `card`, `page`,
`button`, `aspect-ratio`, the seven sectioning tags and the safe-HTML tag factory read
`children || body` and took either. The authoring tier only ever knew `children`, so
an author writing the one spelling that resolved got `unknown-prop` — the same warning a
typo draws, on the tier built to accept AI-authored pages, where the diagnostic **is** the
contract (objectui#6771).

Ruled 2026-09-01: one concept, one spelling, and the spelling is `children`.

## What changed

- **Renderers.** `alert`, `badge`, `tooltip` and the `sidebar-*` family read `children`.
  Every `children || body` fallback drops its `body` arm **except the four `page:*`
  reads named below** — `div`, `card`, `button`, `aspect-ratio`, the sectioning tags,
  the safe-HTML tag factory behind ~36 tags, `page`'s flat content list, and
  `@object-ui/core`'s recursive `validateSchema`.
- **Item-level `body` is a DIFFERENT key and is untouched.** `list` draws each entry
  as `item.content || renderChildren(item.body)` and `tabs` as
  `item.content || item.body`, both filed under the ITEM type rather than the node,
  and `tabs` still ships `body` inside its own `defaultProps`. ⛔ Neither is this
  spelling and neither is refused here: the node-level retirement does not reach a
  member of a declared `items` array. Retiring the item-level dialect is
  objectui#9590's card, and the two named above are recorded on it.
- **What still reads `body` at NODE level, and why.** Four renderer reads, all `page:*`: `page:card`
  (renderer and Studio canvas) and the three thin `page:section` / `page:footer` /
  `page:sidebar` containers. ⛔ Authoring the key is refused on them as it is
  everywhere else; only the READ survives, for documents already STORED under it.
  `@objectstack/spec` states the ground on `PageContainerProps` itself: «The renderers
  keep reading `body` as a back-compat fallback for stored documents; that fallback is
  objectui's to retire on its own schedule, and it is not a second authorable
  spelling.» ⚠️ What separates the two halves is a CONVERSION, not a ground: the spec's
  registry carries `page-card-body-to-children` (`toMajor: 17`, surface
  `page.component.page:card.body`, shipped `retiredFromLoadPath: true` in spec 17.0.0)
  and carries none for the other three — so a stored row under their key has no
  migration path at all. Nothing in this repository authors any of them: the committed
  census over those keys reads a firing control (`card` + `body`, 40 before this change
  and 2 after, both test fixtures) beside a lit zero for `page:section` (6 nodes
  resolved, 0 `body`, 4 `children`). Retiring the four reads is objectui#9916.
- **The published type.** `BaseSchema.body` is `never` on the TypeScript face and an
  alias refusal naming `children` on the Zod mirror, as are the four per-component
  redeclarations (`CardSchema`, `AspectRatioSchema`, `PageNodeSchema`, `TooltipSchema`).
  ⚠️ Refused **by name**, not deleted: `BaseSchema` carries an index signature and the
  mirror ends `.passthrough()`, so a deleted member would be accepted silently and
  rendered by nothing — the exact silence this retirement ends.
- **The VS Code extension (`object-ui`) changes behaviour, not just teaching.** Its
  preview no longer draws a `body`-spelled document — the node renders empty, the way
  the runtime renders it — and its validator now emits a warning naming `children` at
  the key's own position. That warning is skipped for node types that declare their
  own `body` input (`record:alert`), so a declared translation-map `body` is not
  reported as the retired spelling.
- **Two new `@object-ui/sdui-parser` exports.** `RETIRED_CHILD_LIST_KEY` (the retired
  spelling, so a consumer names it once) and `checkRetiredBodyDialect` (the diagnostic
  the tier substitutes for `unknown-prop` on that key).
- **The authoring tier.** `sdui-parser` answers an authored `body` with the replacement
  named, instead of the bare "has no prop" every typo gets — and a `body` child list
  under a non-container draws the same containment code the `children` spelling draws.
- **Corpus and teaching, in the same change.** 114 authored nodes across the docs site,
  the schema catalog, five package READMEs and the VS Code extension's snippets, JSON
  schema, syntax map, hovers and completions. The platform does not refuse a spelling it
  still ships.

## Migrating

Rename the key. `{ "type": "card", "body": [...] }` becomes
`{ "type": "card", "children": [...] }`; both faces now name `children` in the refusal,
and `pnpm census:body-dialect` reports where the dialect still lives in a tree.

⚠️ **Four renderer reads are deliberately untouched, all in the `page:*` namespace** —
`page:card` and the three thin `page:section` / `page:footer` / `page:sidebar`
containers. They are read-only back-compat paths for STORED documents, not a second
authoring face: `@objectstack/spec`'s `PageContainerProps` says so itself — `children`
is canonical, `body` is deliberately not declared, and «the renderers keep reading
`body` as a back-compat fallback for stored documents; that fallback is objectui's to
retire on its own schedule».

⛔ **Authoring `body` on them is still refused**, on both published faces and at the
authoring tier, exactly as everywhere else. What survives is the READ.

⚠️ The two halves are not in the same state. `page:card` has a migration path — the
spec's conversions registry carries `page-card-body-to-children` (`toMajor: 17`,
surface `page.component.page:card.body`), which shipped with `retiredFromLoadPath: true`
in spec 17.0.0. The other three have **no conversion at all**, so a stored row under
their key has nowhere to be migrated to. Retiring these four reads is tracked as
objectui#9916.

**Non-rendering readers keep their arm on the same rule**, and none of them renders
anything: while a renderer still reaches stored `body` content, a reader that must see
the SAME content keeps its arm, or the renderer draws what the reader cannot find.
Those are the two tab-subtree walkers in `renderers/layout/containers.tsx`,
`app-shell`'s `pageSchemaIntrospect` (`CONTAINER_KEYS`) and `PageBlockInspector`
(`STRUCTURAL_PROP_KEYS`, the inspector half of a stored `properties.body`), and the
CLI's `OBJECTUI_STRUCTURAL_KEYS` — a file-IDENTIFICATION marker, where keeping `body` is
what lets an old file still be recognised as an ObjectUI node and therefore refused,
instead of silently not judged.
