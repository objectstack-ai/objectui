---
'@object-ui/types': minor
---

Carry the protocol's registry metadata across both schema derivations, not just the
description (objectui#9102).

**Emitted-surface change.** `stripImportedDefaults` and `deriveStrictAuthoringSchema`
both derive new zod graphs by patching a copy of a node's `_zod.def` and calling its own
constructor. A zod 4 description — and every other registry key — is not `def` state: it
lives in `z.globalRegistry`, keyed by the node. So a def-copying rebuild reproduced `def`
faithfully and reproduced the node's metadata not at all.

objectui#9086 repaired the description at one of the two sites. This change carries the
rest of the vocabulary and repairs the other site.

What moves on the emitted surface:

- **The import boundary.** `z.toJSONSchema` on a `@objectstack/spec` datasource config
  emitted `{description, type}` for `host` where the spec emits `{default, description,
  title, type}`. It now emits `{description, title, type}`. `title` and
  `externalVocabulary` were being dropped from every `ZodDefault` node that carried them.
  `default` stays absent, deliberately: not substituting an author's omitted keys is
  decision batch #90, and the pin file asserts the carry did not quietly undo it.
- **The strict authoring face.** It rebuilds every container it walks, so it kept only
  the descriptions on leaves it returned untouched. Every described container on the node
  face — the great majority of them — arrived on the derived twin with none.

The carry set is **bounded and enumerated** (`CARRIED_REGISTRY_META_KEYS`), not a blanket
spread, and `id` is refused by name: `globalRegistry.add()` writes the registry's shared
`_idmap` whenever the metadata it is handed contains one, so carrying an `id` would
repoint a global id map at this package's derived node. A census re-derives the key
vocabulary over every published spec subpath and fails when the protocol carries a key on
neither list, so the bound costs boundedness and not fidelity.

**No accept set moves, and nothing is mutated.** `.meta()` clones, so the spec's own
objects — which the derived node literally is on the boundary's already-optional branch —
are left as they were found. A subtree with no `ZodDefault` still comes back
reference-equal.
