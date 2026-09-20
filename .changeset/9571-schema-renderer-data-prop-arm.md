---
'@object-ui/core': minor
'@object-ui/react': minor
---

`SchemaRenderer` no longer spreads an authored `data` key as a React prop for blocks
whose published `data` row is the `ViewData` OBJECT arm (objectui#9571, ruling
objectui#8348 Q2-C, decision batch #136 item 3, maintainer 「同意」).

**Behavioural, deliberately.** 「8348 以协议为准」 (batch #83) retired the bare-array
`data` shorthand at the shared record-source ladder, but the key had a second carrier
that the ruling did not reach and that outranked the first: `SchemaRenderer` spreads
every non-metadata node key as a React prop, and `ObjectGrid` (`passedData`),
`ObjectMap` (`dataProp`) and `ObjectGantt` each lift a `data` PROP with an
unconditional `Array.isArray` ahead of the ladder. So an authored
`data: [ …rows… ]` on `object-grid` / `object-map` / `object-gantt` still drew,
end-to-end, after the ladder had refused it. AGENTS.md #0.1: one key, one honoured
spelling — the tolerated second carrier is the defect.

An authored `data` now reaches such a block only as `schema.data`, judged by the
block's own row. In development the renderer says so, once per node: the ladder emits
no runtime signal of its own, so without that warning the retirement would land as a
page that quietly stopped drawing.

**Unchanged, and refused on purpose.** The `data` PROP itself. Gating the prop on the
arm (option B) was refused because that prop is how a host — `plugin-list`'s
`ListView`, `ObjectView` — hands down rows it already fetched. A host rendering
`<ObjectGrid data={rows} …/>` directly, or passing `data` through `SchemaRenderer`'s
own props, still delivers those rows, and still outranks the authored key.

Blocks on the ARRAY arm are untouched: `object-calendar`'s published row is
`z.array(...)`, so its authored bare array is on-contract and keeps the prop seat.
Every type the new reading does not list keeps today's behaviour verbatim.

**Migration.** Author inline rows the declared way —
`data: { provider: 'value', items: [...] }` — or keep using the deprecated
`staticData: [...]` array, which is unchanged. Both were already the only spellings
`os validate` and the save gate accepted.

`@object-ui/core` gains one export, `recordSourceDataArmForType(type)`: which `data`
arm a registered block type declares. It exists for the one consumer that cannot be
handed the arm as a parameter — `SchemaRenderer`, which is generic over every
registered type.
