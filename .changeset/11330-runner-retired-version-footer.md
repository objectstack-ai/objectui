---
'@object-ui/runner': patch
---

fix(runner): the sidebar no longer reads the app's retired `version` key

`version` is a retired key on `@objectstack/spec`'s app schema: the spec
refuses any value there at parse, so no valid app document carries one. The
runner's sidebar still drew a "vVERSION" footer from it, a read that could only
ever render nothing on valid metadata. It is removed.

The read also stopped compiling against objectstack `main`, where a retired
key's TypeScript type became a branded `[REMOVED]` mark instead of `undefined`,
and a mark is not something React can render. Removing it is part of what turns
the `Spec Main Shape Gate` green again, without moving the `@objectstack/spec`
pin (objectui#11330).
