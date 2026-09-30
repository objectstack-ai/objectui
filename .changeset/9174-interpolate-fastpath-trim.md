---
'@object-ui/components': patch
---

Fix `interpolate()`'s no-token fast path skipping its own trim (objectui#9174).

At this change `page:header`'s `title`/`subtitle` (and the record-title `titleFormat`) all went through
`interpolate()` in `packages/components/src/renderers/layout/containers.tsx`. When the
template contained a `{token}` the function collapsed and trimmed whitespace before
returning; when it contained no `{` at all it returned the raw string untouched. A
whitespace-only authored title (e.g. `'   '`) has no token, so it came back unchanged —
truthy — and `PageHeaderRenderer`'s `{explicitTitle && <h1>}` gate drew a **blank `h1`**.
Because `literalTitleText` (`page.tsx`), which decides whether `PageRenderer` delegates
its own heading to the authored header, already trimmed and correctly read "no title",
`PageRenderer` also drew its own implicit heading — two `<h1>` elements on one document,
the broken outline objectui#3434 closed, arriving through a different door.

⚠️ **Dated note, 2026-09-25 — the record title's titleFormat rung now renders through core's formatTitleTemplate — objectui#10447.**
Later in this same release the record-title `titleFormat` stopped going through
`interpolate()`: it renders through `@object-ui/core`'s `formatTitleTemplate`, and a
select token still reads as its translated option label, applied by
`withOptionLabels` to a copy of the record before core renders it. `title` and
`subtitle` still go through `interpolate()`, so the fix below holds for both of them
unchanged.

The fix removes the divergence rather than patching around it: the no-`{` fast path
still skips the token-substitution `replace()` callback (its actual performance
saving), but every template — token or not — now falls through to the same, single
trim/whitespace-collapse call, so the two branches cannot disagree about whitespace
again. A normal, non-empty title renders exactly as before.
