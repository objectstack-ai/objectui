---
'@object-ui/plugin-map': patch
---

An `object-map` block reads its records once per mount, and that read already carries the lookup expansion (objectui#10664).

The map loaded the object definition in an effect of its own and listed it among the fetch effect's dependencies. The definition lands after the first query, so every mount issued two `find` calls, the first without `$expand`. Switching the bound object also sent the new object's query with the previous object's expansion. The map now reads the definition through `useSettledSchema` from `@object-ui/react`, and its object query waits until that read settles, the way `object-timeline` (objectui#7895) and `object-gallery` (objectui#7903) already do. A definition read that fails, or an adapter with no `getObjectSchema`, settles with no definition, so the map still loads, unexpanded. Host rows (`data`) and an inline `value` set are not held.
