---
'@object-ui/react': patch
---

`SchemaRenderer` no longer hands an authored `objectFields` to any component as
a React prop (objectui#8818, completing maintainer decision batch #70,
objectui#7742).

`objectFields` is the object's field catalogue. The predicate layer reads it to
decide how a conditional-formatting rule compares a relation field. Batch #70
ruled it a runtime prop that a host injects, never authorable metadata, but the
renderer's fixed metadata strip list did not name it. So a node that authored
the key had it spread onto whatever component its type resolved to. It now
joins that strip list, and all three authoring spellings are dropped: a
top-level `objectFields`, `properties: { objectFields }`, and the legacy
`props: { objectFields }` alias, which is spread separately and is stripped
too.

Runtime hosts are unaffected. Pass the catalogue as a React prop, either on
the component directly (as `ObjectKanban` does for the board it mounts) or as
an `objectFields` prop on `SchemaRenderer` itself. `SchemaRenderer` spreads its
own props last, so a host prop still arrives. No schema face ever declared the
key, so no published type or validator changes.

⚠️ This supersedes two earlier changeset entries that were true of the tree
they were written against. The objectui#8802 / objectui#8257 kanban-family
retirement entry says the `objectFields` class "is still open" and that
stripping at the `SchemaRenderer` boundary "is what would close the class".
The objectui#7742 batch #70 entry says the key "is absent from
`SchemaRenderer`'s stripped-metadata list". This change is that boundary
strip, so the class is now closed for every type key.
