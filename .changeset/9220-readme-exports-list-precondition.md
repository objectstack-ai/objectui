---
---

`scripts/check-readme-exports.mjs --list` no longer crashes on an unbuilt tree
(objectui#9220). Every `documentedTypes` row now comes out of one factory with
one key set, so the row formatter's field access is safe for any verdict and the
verdict check is back to governing presentation rather than safety; and `--list`
answers an unmet precondition the way `check-doc-snippet-types.mjs` already
does — it prints every row and the census it could derive, then
`PRECONDITION NOT MET (exit 2)` naming the unbuilt packages and a scoped build
command. Exit 2 is dedicated: exit 1 still means a verdict was read and a README
is wrong. Tooling only; no package is released by this change.
