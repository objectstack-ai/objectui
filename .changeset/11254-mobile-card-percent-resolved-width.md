---
'@object-ui/plugin-grid': patch
---

fix(plugin-grid): the mobile card's percent value shows the field's declared decimals

On a narrow screen the grid draws one card per record, and its percent value
read whole percents (`12%`) for a `percent` field declaring `scale: 2`, while
the desktop cell for the same field read `12.34%`. The card now reads the
field's width through `resolveFieldScale` from `@objectstack/spec/data`, as the
desktop cell does. A percent that declares no `scale` is unchanged, and a
column that is not a `percent` field keeps its display.
