---
'@object-ui/plugin-detail': patch
---

A related list reads its rows once per mount, after its child object's definition settles, so a multi-valued relationship's first query is already the `$contains` membership form (objectui#10690, auto-adjudicated B by triage).

`RelatedList` loaded the child object's definition in an effect of its own, and its row fetch did not wait for it. The definition decides the relationship's arity, `$expand` and `$select`, so a child whose definition moved any of them was read twice per mount. For a multi-valued relationship the first query was the bare equality that `driver-sql` refuses with `400 INVALID_FILTER` (objectui#7299). The list now reads the definition through `useSettledSchema` from `@object-ui/react`, and its row fetch waits until that read settles, the gate `object-map` and `object-data-table` use (objectui#10664). An adapter with no `getObjectSchema`, or a definition read that fails, settles with no definition, so the list still loads its rows with the equality form. On the raw-URL fallback, a multi-valued relationship is now refused before any request is sent. Switching the list to another object queries with that object's definition, never the previous one's. A failed definition read is now reported by `useSettledSchema` on `console.error`, where the list used to warn on its own.
