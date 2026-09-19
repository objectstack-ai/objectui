---
'@object-ui/core': minor
---

Drop a saved view's row cap that the contract refuses, at the LOWERING layer every
repaired read point sits under — and say so on the one path that has no renderer to
say it (objectui#9928).

`savedViewLimit` admitted its carrier on `typeof … === 'number'` alone, so a saved
view's `pagination.pageSize` (or its legacy flat `limit`) of `0`, `-10` or `25.5`
lowered unchecked into the composed `limit`. Both ends of that journey are declared
positive — the spec's element data source declares `limit` a positive integer, and a
view's pagination declares `pageSize` a positive integer with a default — so the
lowering layer in between was the one place that asked nothing.

The two consumers of the composed key behave differently, and both were measured
rather than inferred:

- through a RENDERER, the refused value reached a block that has its own guard, so
  the block dropped it and drew its own default — the named view's cap went missing
  and the read went **wider** than the view asked for, in the one direction a named
  view exists to prevent;
- through `ViewDataProvider.resolveElementDataSource`, which forwards this key
  straight to `DataFetcher.fetchRecords` with **no guard of its own**, `0`, `-10` and
  `25.5` reached the fetcher verbatim and nothing anywhere said so.

The cap is now **dropped**, not clamped and not thrown. Clamping was refused because
this layer has no default to clamp to — every consuming block owns its own default
and `ViewDataProvider` owns none, so a number invented here would override a default
the author never asked it to. Throwing was refused because the composer is pure and
sits under every block that can be bound to a view.

Dropping alone would have been silent, and worse than silent: the renderer that used
to report the refused value now receives nothing and correctly says nothing, so the
repair would have removed the only place the author was being told. New export
`elementDataSourceRefusedLimitMessage` is the loud half — a pure builder, following
the shape `elementDataSourceViewNotFoundMessage` already established in this module so
that every caller reports the same defect the same way. `ViewDataProvider` reports it
on the `console.warn` channel the repaired read points use; the value is fail-soft, so
records still load.

Unchanged: carrier precedence (a non-numeric `pagination.pageSize` still falls through
to the flat `limit`), every other composed key, and the binding's own `limit`, which
overrides a view cap exactly as before.
