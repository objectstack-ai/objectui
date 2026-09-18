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
choice per component. Twelve registrations read `body` and nothing else, so it was their
ONLY door; `div`, `card`, `page`, `button`, `aspect-ratio` and the seven sectioning tags
read `children || body` and took either. The authoring tier only ever knew `children`, so
an author writing the one spelling that resolved got `unknown-prop` — the same warning a
typo draws, on the tier built to accept AI-authored pages, where the diagnostic **is** the
contract (objectui#6771).

Ruled 2026-09-01: one concept, one spelling, and the spelling is `children`.

## What changed

- **Renderers.** `alert`, `badge`, `tooltip` and the `sidebar-*` family read `children`.
  Every `children || body` fallback drops its `body` arm **except the `page:*` reads
  named below** — `div`, `card`, `button`, `aspect-ratio`, the sectioning tags, the
  safe-HTML tag factory behind ~36 tags, `page`'s flat content list,
  `@object-ui/core`'s recursive `validateSchema`, and the two container walkers that
  enumerated child channels.
- **What still reads `body`, and why.** `page:card` does, in the renderer and on the
  Studio canvas: that key is `PageCardProps.body`, which this registration
  **published** until objectstack#5775 (PR objectstack#6281) retired it, so documents
  are stored in that spelling and the read is back-compat until the ADR-0087 D2
  load-time conversion rewrites them. The three thin `page:section` / `page:footer` /
  `page:sidebar` containers do too, and ⚠️ **that one is unresolved rather than
  grounded**: they never published `body` on either face, which argues for dropping
  the arm, but whether anything is STORED under it cannot be answered from this
  repository — stored pages live in a database, which is the whole reason the
  `page:card` conversion is a load-time one. The arm stays on the asymmetry of the
  costs, and the question is recorded on objectui#6771 for a seat that can read the
  stored corpus.
- **The published type.** `BaseSchema.body` is `never` on the TypeScript face and an
  alias refusal naming `children` on the Zod mirror, as are the four per-component
  redeclarations (`CardSchema`, `AspectRatioSchema`, `PageNodeSchema`, `TooltipSchema`).
  ⚠️ Refused **by name**, not deleted: `BaseSchema` carries an index signature and the
  mirror ends `.passthrough()`, so a deleted member would be accepted silently and
  rendered by nothing — the exact silence this retirement ends.
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

⚠️ One reader is deliberately untouched: `page:card` still reads `body` first, as a
read-only back-compat path for stored documents. That key is `PageCardProps.body` under a
different, already-ruled retirement (objectstack#5775, ADR-0087 D2) whose own sequencing
note requires the load-time conversion to land first.
