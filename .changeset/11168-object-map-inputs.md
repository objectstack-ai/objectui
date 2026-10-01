---
'@object-ui/plugin-map': minor
---

`object-map` publishes the three keys its `@objectstack/spec` 17.5.0 row declares and its registration left out: `mapStyle`, `navigation` and `enableClustering` (objectui#11168 slice 3, objectui#11111 decision 3 = B). Each was measured on the real renderer first, and the renderer honours all three. The page validator used to report each one as an unknown prop.

- `mapStyle` replaces the demo tiles. When the `map` block carries its own `style`, that one wins, and the description says so. The spec row's prose says the opposite; that divergence is reported on objectui#11168 and not resolved here.
- `enableClustering: true` clusters nearby markers. Without the key, the map clusters only above 100 markers, and `false` turns clustering off at any count.
- On `navigation`, `drawer`, `modal` and `popover` open the marker's record. `new_window`, or `openNewTab: true`, opens the record page in a new tab. On a map that no parent view navigates for, a click opens nothing in these cases: the key is absent, the mode is `page`, `none` or `split`, or the block has no `mode`.

The `map` input's description now lists its members. Rendering is unchanged.
