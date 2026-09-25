---
'@object-ui/app-shell': patch
---

fix(app-shell): `PageView` builds the page node's `context`, it no longer reads one off the page

`PageView` spread `(page as any).context` into the `context` it hands `SchemaRenderer`.
`PageSchema` refuses a page-level `context` key, so on every page that parses the
spread added nothing, and the code read as an author channel that no author could use.
The node's `context` is now exactly `{ params, refreshKey }`, built from the route and
the refresh counter, and the `as any` cast at that spot is gone. A stored document
that carries `context` without passing `PageSchema` no longer passes it through.
`context` stays undeclared on `PageSchema` (objectui#9673).
