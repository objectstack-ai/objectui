---
---

Internal only, no release: `@object-ui/data-objectstack` stops declaring a
module-local `normalizeFilterOperator`, the exact name `@objectstack/spec/ui`
exports, and calls it `toAstFilterOperator` instead (objectui#7265, the
`@object-ui/data-objectstack` slice of the DEBT ledger in
`scripts/check-spec-symbol-derivation.mjs`).

The route is RENAME rather than BIND, and it was decided by measurement against
the RESOLVED 17.4.0 pin rather than by the name. The spec's function folds an
authored spelling to the canonical VIEW vocabulary so `ViewFilterRuleSchema`'s
enum can judge it; this package's translates the same input into the server's
filter-AST symbols, so the spec answers `equals` and `before` where this one
answers `=` and `<`. Same input, different codomain: swapping it in would have
changed what goes on the wire for most of the operators a stored view can carry.

Two things the measurement overturned, both now pinned. The `?? op` tail is not
where the two differ — both hand an unrecognised string back unchanged, so the
lenient tail is common ground. The tail does diverge on the other arm, and in the
opposite direction: the spec returns a NON-string verbatim where this package
returns `null`, and `objectFilterEntryToAST` reads that `null` into a
`MalformedFilterError`. Binding the spec would therefore have widened what this
adapter accepts onto the wire, not tightened it.

The declaration was never exported and no behaviour moved with the name, so
nothing published changes and no package is released by this change.
