---
'@object-ui/app-shell': patch
---

Fix the form-designer canvas picklist preview: `FieldStub` now filters the
options before slicing them, so a well-formed option is no longer hidden by
malformed ones in front of it and the `+N` overflow counter stops overcounting
(objectui#9074).

The preview took the first one (single-value) or three (multi-value) authored
options and *then* dropped the ones with neither a value nor a label. Entries
that render as nothing therefore consumed the display budget, and the counter —
computed against the whole authored list — reported a number no badge on the
card accounted for. With the authored list `['draft', 'open', 'closed',
{ value: 'real', label: 'Real' }]`, which `ObjectFormCanvas` projects to three
`{ value: '', label: undefined }` entries followed by one good one, the
multi-value card showed its empty-state placeholder plus `+4` and zero badges,
and the single-value card read as a field with no options at all — with `Real`
on neither.

Both now render `Real`, and `+N` counts only options that survived filtering and
did not fit. A picklist with no malformed options previews and counts exactly as
it did before: when every entry survives the filter, filtering first and slicing
first compute the same result.
