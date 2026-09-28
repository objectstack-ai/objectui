---
'@object-ui/components': minor
---

feat(components): a `kind: 'react'` page's author scope injects `useDataInvalidation`

A react page reads data through the injected `useAdapter`, in an effect it
writes itself. The scope gave that effect no data-invalidation reader to name,
so the read the react-pages guide taught, keyed on `[adapter]`, re-ran only
when the page was remounted (as `PageView` does after a page action) or its
adapter changed.

The scope now injects `useDataInvalidation` from `@object-ui/react` beside
`useAdapter`: the same hook `ListView` reads to refresh its rows.
`useDataInvalidation('showcase_project')` returns a number that moves when the
data-invalidation bus reports a write to that object, or an unscoped `'*'`.
Named in the dependency list of the effect that reads through `useAdapter`, it
re-runs that read in place: the page is not remounted and keeps its own state.
A write to another object does not re-run it, and a page that does not name the
hook behaves as before. The hook is a module-level function, so the scope's
identity is as stable as it was and injecting it recompiles no page.

The react-pages guide (`content/docs/guide/react-pages.md`) lists it in the
scope table, and its Live data example names the nonce in the effect's
dependencies.

**Clause-②: yes** — one identifier joins the published author scope of
`kind: 'react'` pages, so the set of names a page's source can resolve widens.
Nothing is removed or renamed. The one source this can break is a page that
declares its own top-level `const` or `let` named `useDataInvalidation`: the
scope's names are the parameters of the function the source is evaluated in,
so that declaration is now a `SyntaxError`, shown in the page's error panel.
Renaming the page's own identifier resolves it.
