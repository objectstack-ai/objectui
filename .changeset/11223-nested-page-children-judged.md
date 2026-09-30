---
'@object-ui/types': minor
---

`safeValidateSchema` — and so `objectui validate` — and `StrictAnyComponentSchema` judge a component nested in a page container's props bag (objectui#11223).

**Clause-②: no (narrowing)** — a document whose bag child is malformed, or names a `type` no arm declares, parsed on both faces and is refused now. Nothing that was refused before is accepted, and no export is added or removed.

**What it was.** The page containers take their child lists in the bag: `properties.children` on `page:card`, `page:section`, `page:footer` and `page:sidebar`, and `properties.items[].children` on `page:tabs` and `page:accordion`. Their arms read the spec's `ComponentPropsMap` rows by reference, and the rows type every one of those slots as a list of anything, so neither face looked inside it. The same child in a node-level child slot was judged by its own component schema.

**What changed, in observable terms.**

- `AnyComponentSchema` judges every component nested in a node's bag with the same union, at each position `@objectstack/spec`'s own page walk (`walkAddressedPageComponents`, `@objectstack/spec/system`) descends — read from the installed spec at parse time, not listed here. Each issue is reported at the nested node's real path, for example `properties.children.0.properties.content`, and an unknown nested `type` gets the discriminator's own verdict at `….type`, which `objectui validate` prints as "No arm accepts type …" with the nearest accepted types. The judgment runs even when the node refuses something of its own, and it applies at every depth, including under a node-level child slot.
- `StrictAnyComponentSchema` judges those components against its own strict twin of the union, so an undeclared key on a nested component is refused by name there, as it is one child slot down.
- Entries of a bag child list that the spec's walk does not visit — a string, a number, `null` — are not components to it and are not judged.
- One slot the renderer draws is not walked yet: `page:card`'s `properties.footer`. The spec's exported walk does not descend it, so a component written there is still accepted unexamined; it is judged the day the walk descends it.
- A container's own arm schema parsed alone (`PageSectionBlockSchema.safeParse(…)`) is unchanged: the judgment lives on the union.
