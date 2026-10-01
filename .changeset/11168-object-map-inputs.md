---
'@object-ui/plugin-map': minor
---

`object-map` publishes the three keys its `@objectstack/spec` 17.5.0 row declares and its registration left out: `mapStyle`, `navigation` and `enableClustering` (objectui#11168 slice 3, objectui#11111 decision 3 = B). Each was measured on the real renderer first, and the renderer honours all three. The page validator used to report each one as an unknown prop.

- `mapStyle` replaces the demo tiles. Its description is the spec row's own, verbatim: it is read before `map.style`. The renderer now reads it that way too; the `mapStyle` precedence entry in this release states that change.
- `enableClustering: true` clusters nearby markers. Without the key, the map clusters only above 100 markers, and `false` turns clustering off at any count.
- On `navigation`, `drawer`, `modal` and `popover` open the marker's record. `new_window`, or `openNewTab: true`, opens the record page in a new tab. `page` and a block without `mode` open the record page of the map's `objectName` through the record navigator the host publishes (the console publishes one on its custom pages, record pages and list views). Under a host that publishes none, or on a map that names no `objectName`, they open nothing. On a map that no parent view navigates for, a click also opens nothing when the key is absent or the mode is `none` or `split`.

The `map` input's description now lists its members. Apart from the `mapStyle` precedence, rendering is unchanged.
