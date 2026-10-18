---
'@object-ui/plugin-list': patch
'@object-ui/fields': patch
---

The list's quick-search box and the record pickers' type-ahead are no longer offered on an object whose search resolves to no field, and a refused search shows the server's message (objectui#12966, the console half of objectstack#24284).

objectstack now answers a non-blank `search` over such an object with `400 INVALID_FIELD` (`param: 'search'`) instead of every row. The common shape is a junction object: two lookups and a composed formula title, with no `searchableFields` declared.

- **The list toolbar** decides with the spec's `resolveSearchFieldResolution`, over the object definition with `internal: true` fields left out and the object's own `searchableFields`, the inputs the engine uses. When the set is empty the search box is not drawn, and a term restored at mount is not applied. Until the definition is read the box is drawn, as before; the list is loading for that read anyway, since its data fetch waits on it. A list whose data source serves no definition keeps the box. A view's `searchableFields` does not make such an object searchable: the server refuses that override outside the object's set.
- **`RecordPickerDialog` and `LookupField`'s inline dropdown** draw no search box on a target whose set is empty. They still list the records, and the dialog still pages them. An unknown target schema keeps the box.
- **A refused search** on a list now shows the server's sentence, which names the object and the two remedies, in place of the generic "query was rejected" copy. The record pickers already showed the server's message.

Nothing is added to either package entry: no export, prop or type member.
