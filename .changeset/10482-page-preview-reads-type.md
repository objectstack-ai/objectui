---
'@object-ui/app-shell': patch
---

fix(app-shell): the page designer's preview decides "record page" from `type` alone (objectui#10482)

`PagePreview` bound a sample record when a draft carried `type: 'record'` or
`pageType: 'record'`. `PageSchema` refuses `pageType` (an alias of `type`), and the
runtime resolver `usePageAssignment` reads `type` alone since objectui#9674, so a raw
draft carrying only the alias got a record preview that the runtime never gives it.
The preview now reads `type` alone: a draft whose only record marker is `pageType`
renders unbound, with no sample-record fetch. A `type: 'record'` draft binds exactly
as before.
