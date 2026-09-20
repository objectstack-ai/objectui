---
'@object-ui/plugin-list': patch
'@object-ui/plugin-view': patch
---

Deliver an authored map `style` on the list-view and object-view paths (objectui#9950).

`ObjectMapConfigSchema` declares `style` ("MapLibre style URL/spec (overrides the
public demo default)"), and both view flatteners dropped it before the renderer ever
saw it. A view authoring `map: { style: 'https://…/style.json' }` parsed green, nothing
refused it, nothing warned, and the map rendered on MapLibre's **public demo tiles**.

Each flattener's key whitelist is now a TOTAL spelling table,
`FLAT_MAP_CONFIG_SPELLING`, mapping every key `ObjectMapConfigSchema` declares to the
name the internal flat form uses for it. Every entry is the identity except `style`,
which is delivered as `mapStyle`.

`mapStyle`, not `style`, because the top-level `style` key is `BaseSchema.style` —
inline CSS, legal on every node. Collapsing the two namespaces onto one key is the
defect objectui#5177 closed and this change deliberately keeps closed: the flatten
still never writes a top-level `style`. `mapStyle` is a declared member of
`ObjectMapSchema` and is the first spelling `getMapConfig` reads
(`schema.mapStyle || schema.map?.style`), so the authored style now reaches the
renderer without inventing an undeclared transport key.

An undeclared key in the `map` block still never reaches the product — that half of
objectui#5177 is unchanged and pinned in both packages' `mapFlatten` suites.

**Why the anti-drift pins did not catch this.** Both sites already pinned their hand
list against the declaration, and both pins were green. They compared the list against
`Object.keys(ObjectMapConfigSchema.shape).filter((key) => key !== 'style')` — the
comparison set had the same key subtracted from it that the whitelist was missing, so
the pin agreed with the omission. Those pins now measure the relation "every declared
key is delivered, under its flat spelling" against the declaration read whole, and each
suite carries a control that feeds the pre-fix whitelist to the same assertion and
shows it rejected. The spelling table is additionally a `Record` over every
`keyof ObjectMapConfig`, so a key added to the declaration fails `tsc` until it is
given a flat spelling.

**Migration.** None. Views that never authored `map.style` are byte-identical in
behaviour; views that did now render with the style they declared instead of the
public demo tiles.
