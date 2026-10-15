---
'@object-ui/types': minor
'@object-ui/console': patch
---

The page kind `jsx` is retired from the page node, following `@objectstack/spec` 18 (objectstack-ai/objectstack#23638), which refuses it at parse and names `html` as its replacement (objectui#12464).

**Breaking (levelled `minor`, per this repo's version policy): `PageNodeSchema.kind` narrows.** The exported `PageNodeSchema` type's `kind` is now `'full' | 'slotted' | 'html' | 'react'`; a page node literal typed with it no longer compiles with `kind: 'jsx'`. Author `kind: 'html'` instead: the page's `source` is compiled and rendered exactly as before. The zod face (`PageNodeSchema` from the package's zod entry) refuses `kind: 'jsx'` at `kind` the same way, so `objectui validate` and `objectui check` report it.

Unchanged: `@object-ui/components`' page renderer still renders a stored `kind: 'jsx'` page as `html`. A server on a spec release built before the retirement can still serve such a row, so that branch is dropped only once the resolved `@objectstack/spec` carries the retirement.

The console's `sdui-jsx-preview` sample page now authors `kind: 'html'`, and the React Pages guide no longer presents `jsx` as an accepted alias.
