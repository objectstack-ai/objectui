---
'@object-ui/components': minor
---

The page renderer no longer compiles a `kind: 'jsx'` page node as `html`. This completes the retirement of the page kind `jsx` that `@objectstack/spec` 18 made (objectstack-ai/objectstack#23638) and objectui#12464 began (objectui#12486).

**Breaking (levelled `minor`, per this repo's version policy): the page renderer narrows.** `PageRenderer` used to compile a node's `source` when its `kind` was `html` or `jsx`. It now compiles it for `html` only. A raw page node that still carries `kind: 'jsx'` loses its compiled `source`: it takes the template / page-type layout path that a node with no `kind` takes, so it draws its `children` or `regions` and never reads `source`. Such a node can only come from code that builds it past the types, which have refused `kind: 'jsx'` since objectui#12464. Author `kind: 'html'` instead; the source compiles and renders exactly as before.

A page served by an `@objectstack/spec` 18 server cannot carry `jsx`, so served pages are unaffected. `18.0.0-next.2`, which objectui now resolves, has `COMPILED_PAGE_KINDS` of `html` alone and refuses `jsx` at parse, and spec 18's stored-row rehydration rewrites a stored `jsx` page to `html` before it is served.
