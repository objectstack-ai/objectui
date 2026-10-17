---
'@object-ui/plugin-list': minor
---

A list's user-filter chip no longer shows the raw field key while the object definition is loading (objectui#12890).

A chip declared without a label (`userFilters.fields: [{ field: 'category' }]`) takes its name from the object definition. Until that definition arrived, the chip, its text-search placeholder, its person-picker search prompt and the deprecated toggle button all showed the machine key (`category`), which a zh-CN viewer then saw replaced by `分类`. While the definition is loading, these now show a skeleton (or no text) instead. Once it arrives the chip shows the field's translated label, as before. A chip with an authored `label` shows it throughout. If the loaded definition has no such field, the chip still falls back to the key.

`UserFiltersProps` gains an optional `objectDefPending` flag, which `ListView` sets while it fetches the definition. A host that leaves it out gets the previous behaviour.
