---
'@object-ui/plugin-gantt': patch
---

fix(plugin-gantt): a percent row in the gantt tooltip shows the field's declared decimals

A tooltip row over a `percent` field declaring `scale: 2` read whole percents
(`12%`) while the list cell for the same value read `12.34%`. The row now reads
the field's width through `resolveFieldScale` from `@objectstack/spec/data`, as
the list cell does. A percent that declares no `scale` is unchanged.

`@object-ui/plugin-gantt` raises its `@objectstack/spec` floor to `^17.5.0`,
the first release exporting `resolveFieldScale`.
