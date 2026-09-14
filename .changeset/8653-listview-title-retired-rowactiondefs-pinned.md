---
'@object-ui/plugin-list': minor
---

`list-view`: retire the legacy `title` alias from the export-filename read, and pin the
`rowActionDefs` exemption at both of `ListView`'s read sites (objectui#8653, the
objectui#8327 family's `plugin-list` card).

**Two keys, two opposite exits — and the contract chose each one.**

`title` — **retired.** `ListView` resolved its export filename through
`schema.label || (schema as any).title`. `@objectstack/spec/ui`'s `ListViewSchema`
refuses `title` **by name** (`unrecognized_keys: ['title']`) while
`ObjectGridPropsSchema` **accepts** it; `packages/types` mirrors the platform contract
rather than ruling over it, so declaring `title` on `ListViewSchema` would have made
this repo accept what the platform save gate rejects. That asymmetry is also why
objectui#6639 could take the *declare* branch for `ObjectGridSchema.title` one package
over and this site could not. A parse-based census of `apps/ examples/ content/` and
`packages/` found **zero** `list-view` nodes authoring `title`, so the retirement costs
no author a filename. Over that same corpus the instrument reports **three**
`object-grid` nodes carrying the key: **two authored** ones, both in
`content/docs/api/schema-reference.md`, plus one that is not authored at all —
`packages/plugin-view/src/ObjectView.tsx` composes `title: schema.table?.title` onto a
grid node it builds, so it is a producer writing the key rather than an author
declaring it. `ObjectGrid`'s own `title` reads are untouched — they remain declared,
ruled and read.

**Behaviour change, deliberate.** A list view authoring only `title` (no `label`) no
longer contributes a view segment to the export filename; it exports as
`<objectLabel|objectName>-<timestamp>.<ext>`. Migration: write `label`, which is the
declared slot on both this repo's `ListViewSchema` and the platform's.

**Bug fixed in the same expression.** The `as any` was laundering a second defect:
`X || any` collapses the whole expression to `any`, so an inline locale-map `label`
(`{ en: 'Quarterly Review', zh: '季度复盘' }` — the shape `BaseSchema.label` has
published since objectui#4580's revised Q1) reached `sanitizeFileNameBase` **unresolved**
and exported as `account-[object Object]-….csv`. The read now goes through the spec's
own `resolveI18nLabel` against the display locale, the same resolver and argument order
`ObjectGrid` already used at its twin site.

`rowActionDefs` — **exempt, still read, and now pinned.** objectui#5091 ruled this
producer-derived key NON-AUTHOR SURFACE for `object-grid` on 2026-08-19. The exemption
extends to `ListView`: the platform refuses the key by name on **both** surfaces,
`@object-ui/types` declares it on neither mirror, and the producer is the same one
(`app-shell`'s `ObjectView` derives it from `objectDef.actions` filtered by
`locations.includes('list_item')`; `plugin-view`'s composes the same key onto a
`list-view` node). Both read sites now carry the ruling in a docblock, and a new pin
asserts — at runtime, never by source grep — that the defs still reach the child
`object-grid` node **and** that a field named only by a row action's `visible` CEL still
reaches `$select`. Without that second half, deleting the read would have returned rows
whose predicate operand was never selected: objectui#3501's fail-closed CEL fault
arriving with a success receipt.

No published type changed: neither key is declared on any face by this change.
