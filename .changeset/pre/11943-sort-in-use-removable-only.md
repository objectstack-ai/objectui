---
'@object-ui/components': minor
'@object-ui/plugin-list': patch
---

The list's Sort picker lists a field it keeps only for the current sort as removable, never as a new choice (objectui#11943).

`SortBuilder`'s `fields` entries take an optional `disabled`. A disabled entry is drawn as an unavailable option in every row's dropdown and cannot be chosen by click or keyboard. A row whose field it already is still shows its label, and can be changed to another field or removed. "Add sort" seeds the first entry that is not disabled, and is disabled when every entry is. An entry without the flag behaves as before.

`ListView` sets the flag on each field its Sort picker keeps only because the current sort names it: a field the user may not read, a field the platform refuses to order by, and a relational field listed as ordering by ID. Before this, a stored or URL sort on such a field left it choosable in the picker's other rows, and "Add sort" seeded it when it came first.
