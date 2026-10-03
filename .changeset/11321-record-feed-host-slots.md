---
'@object-ui/types': patch
---

A host feed slot written on a `record:activity` or `record:history` node is refused by name: `items` and `entries`, and the `loading` flag paired with each (objectui#11321).

**What it was.** Both renderers take a feed a host already owns. `record:activity` reads `items` and `record:history` reads `entries`, each with a `loading` flag, on the node or in `properties`. A host supplies them in code, on a node it composes: a TSX composition (the plugin-detail README hands `record:activity` its `items` inside a `DetailView` tab), or the record page's synthesizer for `record:history`. None of them is authorable metadata. A feed written into a JSON document is a snapshot that never updates, and an authored `loading: true` pins the loading state on forever. Written on the node, each key passed `safeValidateSchema`, and so `objectui validate`, unjudged, and the strict authoring face refused it only as an unnamed `unrecognized_keys`.

**What changed, in observable terms.**

- On the node, `items` and `loading` on `record:activity`, and `entries` and `loading` on `record:history`, are refused by `safeValidateSchema` and by `StrictAnyComponentSchema` with `invalid_type` at the key's own path, at every depth the faces judge. The message names the key as the block's host feed slot, says a host supplies it in code, and tells the author to omit it, because the block then finds its own feed.
- In `properties` nothing changes. There the keys meet the block's `@objectstack/spec` row, which these arms take by reference. The `record:history` row already names `entries` and `loading` as the host's channel, and both faces carry that message. The `record:activity` row does not name `items` or `loading` yet, so that refusal stays the row's generic one until the spec adds it.
- Any other undeclared key on these nodes stays as before: unjudged by the tolerant face, refused by the strict face.

**What does not change.** Nothing at render time. A host that passes `items` or `entries` on a node it composes in code keeps working: that node is rendered by `SchemaRenderer` and never passes through these faces, and the renderers' own props interfaces keep the keys typed.

**Across the release.** The `record:activity` and `record:history` arms have not shipped yet: `@object-ui/types` 17.6.0 has no public-block arm, and its `safeValidateSchema` refuses both types at `type`. So this narrows what earlier entries of this same release accept, and nothing a published consumer could validate before.

**Docs.** The `record:related_list` example in the schema reference's retired-`related` note now writes its props in the `properties` bag, the last of the flat public-block examples objectui#11321 named. The plugin-detail page says `items` is passed in code and refused when a document writes it.

⚠️ **Dated note, 2026-10-02 — the plugin-detail README no longer passes `items` — objectui#11515.**
At this change the plugin-detail README handed `record:activity` its `items`
inside a `DetailView` tab, the TSX composition the paragraph above names; now
that tab authors the block's declared `properties`, and no example in this
repository composes a `record:activity` node with `items`. The refusal and
what a host may still do in code are unchanged. The rest of this entry is kept as the reading of this change.
