---
'@object-ui/data-objectstack': minor
---

`formatMetadataError` and `formatMetadataIssue` are exported from `@object-ui/data-objectstack`: the one reader of a failed metadata save (objectui#11302).

A save the spec refuses answers `422 INVALID_METADATA` with a headline message (a count plus `path [code]` locators) and the author's prescription in structured issues, which `MetadataClient` puts on `MetadataError.issues`. `formatMetadataError(err)` lists those issues one field per line (`• fields.amount.type — Required`) and falls back to the error's message when there are none; `formatMetadataIssue(issue)` is that one-line grammar, for callers that format a list of failures. Render the result with a whitespace class that keeps newlines.

The reader moved here from `@object-ui/app-shell`, where it was internal, so every surface that saves through `MetadataClient` can render a refusal the same way. Additive: nothing existing changed.
