---
'@object-ui/core': minor
'@object-ui/react': minor
---

A `dataSource` binding's own `limit` that the contract refuses is now treated as **not
authored**: the row cap falls through to the named saved view's usable cap, and only when
that is absent too to the consumer's own default (objectui#10016).

**Behaviour change.** `composeElementDataSource` resolved the cap as
`config.limit ?? savedViewLimit(view)`. objectui#9928 put a positivity check on the view's
operand only, so a binding `limit` of `0`, `-10`, `25.5` or a non-number went through
unchecked:

- through `ViewDataProvider.resolveElementDataSource` it reached `DataFetcher.fetchRecords`
  verbatim, and nothing said so;
- through `ElementDataSourceGate` it was written over everything, a usable component cap
  included, and the consuming block then dropped it and drew its own default, so the read
  went wider than either the view or the component asked for.

Both operands now pass the same check, and a refused cap from either is not authored. The
chain is: a usable binding cap, else a usable view cap, else none. This is the rule
objectui#10009 set one layer up (a value the contract refuses is not authored, so the other
source wins), applied to the two operands of one resolver. On the renderer path the view's
cap that takes the binding's place is a baseline like any other view-sourced value, so a
usable component cap still wins over it. A usable binding `limit` still beats both, exactly
as before.

**Diagnostics.** `elementDataSourceRefusedLimitMessage` takes two optional trailing
parameters, the binding and the operand (`'view'`, the default, or `'binding'`). The binding
operand has its own sentence, naming the binding, so a binding refusal and a view refusal
are told apart when both fire. `ViewDataProvider` and `ElementDataSourceGate` report it once
per declaration on the existing `console.warn` channel; the gate reports it only for a block
that reads a row cap. Called with three arguments the builder answers exactly as before.

**Fixed with it.** `ViewDataProvider` reported a saved view's refused cap even when the
binding's own usable `limit` was the cap actually used, and that warning's claim that the
fetch falls back to a default was false. The view's refusal is now reported only when the
binding's `limit` is absent or refused. The builder applies that condition itself, so both
callers share one copy of it.
