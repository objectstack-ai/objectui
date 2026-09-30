---
'@object-ui/types': minor
---

The four `page:` containers take their child list in `properties.children`, the member their `@objectstack/spec` row declares, and refuse a node-level `children` by name: `page:card`, `page:section`, `page:footer` and `page:sidebar` (objectui#10872, batch 6).

**Clause-②: yes (narrowing).** On each of the four zod arms, `children` and `body` are declared as by-name refusals, each kept a member of the arm. Both carry one message per block, which names `properties.children`.

**What it was.** Each arm took `BaseSchema`'s node-level `children` as it was, so `{ "type": "page:section", "children": [ … ] }` parsed green on both faces (`safeValidateSchema`, and so `objectui validate`, and `StrictAnyComponentSchema`). `@objectstack/spec`'s own `PageComponentSchema` refuses that node: a page component has no node-level `children`, and the key is refused as unrecognized (ADR-0089 D3a). So `objectui validate` accepted a page that `os validate` refuses. A flat `body` was already refused, by `BaseSchema` (objectui#6771), but its message sent the author to the node-level `children`.

**What changed, in observable terms.**

- A node-level `children` on any of the four is refused with `invalid_type` at its own path, on both faces and nested in a page.
- `body` is refused as before, at the same path with the same code. The message no longer says "Did you mean `body` → `children`".
- The message's first sentence names `properties.children` and the row that declares it (`PageCardProps`, or `PageContainerProps` for the other three), with the node to write: `{ "type": "page:section", "properties": { "children": [ … ] } }`.
- `properties.children` parses on both faces, as it did. The spec row declares it on all four, and the spec's `PageComponentSchema` passes it.

**Nothing renders differently.** The renderers are not touched and keep reading the node-level `children` and `body` for stored documents. `SchemaRenderer` hoists every `properties` key onto the node before the renderer runs, so a container authored with `properties.children` renders the same child list. The page designer's canvas addresses `properties.children` on these blocks, and the default page synthesizer emits none of them; where the node-level spelling still appears in a tree, `pnpm census:body-dialect --keys page:card,page:section,page:footer,page:sidebar` lists it.

**Why `minor`, and why this breaks no published document.** `minor` follows the objectui#9256 narrowing precedent. This repo's version policy forbids `major` in any changeset (one `fixed` group), and records a narrowing as `minor` with an explicit note like this one. But the narrowing is not breaking against the last release. In `@object-ui/types` 17.6.0 no arm claims these four types, so every document naming one is refused with `invalid_union`: their arms (objectui#10872 batch 1) are unreleased, and ship in the same release as this entry. So no published version ever accepted a node-level `children` on these nodes: across the release, the accept set only widens.

Also in this change, with no behaviour change: `objectql.zod.ts`'s two public-block arms (`object-metric`, `object-master-detail-form`) build their `properties` member with the same `propsBag` helper as the other public-block arms, instead of a byte copy of it. The member's description text is unchanged.

Migration: move the child list into the bag. `{ "type": "page:section", "children": [ … ] }` becomes `{ "type": "page:section", "properties": { "children": [ … ] } }`.
