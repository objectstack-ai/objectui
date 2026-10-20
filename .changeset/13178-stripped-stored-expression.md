---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

fix(app-shell): the save warning has a sentence of its own for a value a stored expression replaced

objectstack-ai/objectstack#24778 gives the write path a fifth strip reason,
`stored_expression`: a stored field whose declared expression the engine computes
on every write keeps the computed value, not the one the caller sent. The save
warning words that reason as what it is — "Computed from the record, so the
computed value was saved instead of the one sent: …" — through a new
`detail.writeStrippedStoredExpression` key in all ten locale packs, and never as
a read-only lock.

The reason table stays exhaustive over the spec's union, widened ahead by the one
literal so it compiles both against the published `@objectstack/spec` (which does
not name the arm yet) and against objectstack's own spec, which the objectstack
Console Pin Gate builds this package with.

When the sentence reaches a user: the adapter judges a reported reason against
the spec release this bundle is built with, so until that release declares
`stored_expression` such a report is still shown as "Not applied by the server: …"
— truthful, but without the cause. The new sentence is used from the spec release
that declares the arm on.
