---
"@object-ui/app-shell": patch
---

fix(app-shell): the object page no longer re-issues the identical list query on re-renders that change nothing

The object page rebuilt the `options` bag it hands `ListView` as a fresh object
on every render, and `ListView` names `schema.options` by identity in its fetch
effect's dependencies. So every re-render of the page re-ran that effect into a
byte-identical `dataSource.find`: one extra round trip when the page mounted
(the record count landing re-renders it), two when a record was opened and two
more when it was closed.

The page now keeps the previous `options` object while its content is
unchanged, compared by value. Any real change to the bag still hands over a new
object and still refetches, and a view switch still issues exactly one query.
