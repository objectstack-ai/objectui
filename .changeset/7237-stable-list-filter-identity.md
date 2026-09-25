---
"@object-ui/app-shell": patch
---

fix(app-shell): the object page no longer re-issues the identical list query for a view with a filter on re-renders that change nothing

The object page resolved the view's filter placeholders into a fresh array on
every render, even when nothing was substituted, and `ListView` names
`schema.filter` by identity in its fetch effect's dependencies. So for any view
that declares a filter, every re-render of the page re-ran that effect into a
byte-identical `dataSource.find`, including one extra round trip at mount.

The page now keeps the previous filter value while its resolved content is
unchanged, compared by value through the same comparison the `options` bag
already uses. A real change (another URL filter, another session scope, a date
placeholder that resolves differently) still hands over a new value and still
refetches.
