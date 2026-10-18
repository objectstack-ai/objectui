---
'@object-ui/app-shell': patch
---

A record page open reads its record once: the page's own `$expand` read is no longer sent a second time when the object definition reaches the page again as a new object (objectui#11699).

Measured on full reloads of a showcase task record page (a real ObjectStack backend and a production console build, 4 reloads per build): the page's `$expand` read of the record (`GET /api/v1/data/OBJ?populate=…`) went from 2 per open, one after the other, to 1. API requests per reload went from 40 to 39. The second read came from a host re-render that handed the page an identical object definition as a new object. The definition was equal to the previous one, so nothing the read sends had changed.

- **The record page keys its record read on what the read sends.** The load effect depended on the object definition, the page and the permission answer as objects. All it reads from them is whether a page exists and the list of relations to expand after field-level security. It now depends on those two values. The record is no longer read again for an equal definition handed down as a new object, for an assigned page that replaces the synthesized default page, or for a permission answer that leaves the list unchanged. A permission answer that denies a relation still reads the record again without that relation, and so does a definition whose relations change.
- **`useMetadata().objects` keeps its identity.** The list and its entries stay the same objects while the stored object and view metadata stay the same. A re-render, or another metadata type landing, no longer rebuilds them. A landed object or view fetch, or an invalidation, still produces a new list that carries the change.

Nothing is added to the package entry: no export, prop, type member or language-pack key. `mergeViewsIntoObjects` and `attachInlineSubforms` keep their signatures.
