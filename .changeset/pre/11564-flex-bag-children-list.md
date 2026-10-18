---
'@object-ui/types': minor
---

`FlexBlockNode`, the TypeScript type of an authored `flex` node, types its bag's child list as nodes: `properties.children` is `SchemaNode | SchemaNode[]`, where it was `unknown[] | SchemaNode` (objectui#11564).

**Clause-②: yes (narrowing)**, TypeScript authoring face only, shipped as `minor` per this repository's version policy. The list is the form a `flex` node is authored in (`{ type: 'flex', properties: { children: [ … ] } }`), and until now each entry was `unknown`, while a single child was already judged as a node. Each list entry is now judged as a node too, against its own `type`:

- an entry whose `type` no declaration names, or an object with no `type`, no longer compiles;
- an entry that is itself a list no longer compiles;
- a misspelled key on a node type without an index signature (the spec-derived nodes, such as `element:text`, and a closed `CustomNodeRegistry` entry) no longer compiles. Node types that extend `BaseSchema` keep its index signature until objectui#8347 removes it, so a misspelled key on one of them still compiles, in the list exactly as in a single child;
- a primitive entry (a string, a number, `null`) still compiles, as in every node slot.

The type is the flat `FlexSchema` mirror's own `children` member, by reference, which is also the member `FlexLayoutProps` declares. Every other member of `FlexBlockNode` and of its bag is still read off the `FlexBlockSchema` arm.

What does NOT move: every zod face and every runtime path. `FlexBlockSchema` keeps `z.array(z.unknown())` for the list, because `@objectstack/spec`'s page walk already judges each entry there, once, at its real path, on the tolerant and the strict face (objectui#11223). The one entry kind where the faces now differ is a nested list, which the walk passes through unvisited and the TypeScript face refuses; `@object-ui/types`' mirror-parity ledger records the divergence.

**Migration.** Give each list entry its declared node type (or `DeclaredNode`), declare a custom type in `CustomNodeRegistry`, and flatten a nested list into the one list.

⚠️ **Dated note, 2026-10-04 — `BaseSchema` loses its index signature — objectui#8347.** At this change, "Node types that extend `BaseSchema` keep its index signature until objectui#8347 removes it, so a misspelled key on one of them still compiles" held. Later in this same release objectui#8347 removed that signature, so a misspelled key on a node type that extends `BaseSchema` no longer compiles either, in the list exactly as in a single child. `.changeset/8347-baseschema-closed-face.md` states what ships. The rest of this entry is kept as the reading of this change.
