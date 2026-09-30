---
'@object-ui/console': patch
---

fix(console): the docs portal's book sidebar keeps a doc placed by its own `group` key from outside the book's package (objectui#11245)

A doc names the book group it belongs to through its own `group` key. The framework's
`resolveBookTree` places such a doc in that group with no package scope (only a group's
`include` is scoped), and `GET /meta/book/:name/tree` answers that resolver. The portal
dropped every doc outside the book's package BEFORE resolving, so a doc an admin placed
from the doc editor was listed by the tree endpoint and missing from the book sidebar:
its group rendered empty, the book card did not count it, and a book with nothing else
to open showed "This book has no documents yet".

`scopeDocsToBook` now keeps a doc whose `group` names one of the book's group keys,
whatever its package. The package filter still narrows what `include` and the synthetic
Uncategorized group can collect, so another package's ungrouped docs stay out of the
book, and a group-level `package` override still scopes that group's `include`.
