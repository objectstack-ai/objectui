---
'@object-ui/components': patch
---

`element:record_picker`'s `limit` input description now states the row-cap precedence the
picker actually resolves (objectui#10399). It used to read `dataSource.limit ?? limit ?? 50`
with the binding winning outright, which skipped the named saved view's cap and, since
objectui#10016, was also false for a binding cap the contract refuses. The description now
names four sources in order (the binding's `limit`, the named view's row cap, the picker's
own `limit`, then 50) and says that a refused binding or view cap (`0`, a negative, a
non-integer) is treated as not authored and falls through. Text only: no behaviour change.
