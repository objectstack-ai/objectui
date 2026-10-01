---
'@object-ui/plugin-map': minor
---

`object-map` publishes the three keys its `@objectstack/spec` 17.5.0 row declares and its registration left out: `mapStyle`, `navigation` and `enableClustering` (objectui#11168 slice 3, objectui#11111 decision 3 = B). Each was measured on the real renderer first, and the renderer honours all three. The page validator used to report each one as an unknown prop.

- `mapStyle` replaces the demo tiles. Its description is the spec row's own, verbatim: it is read before `map.style`. The renderer now reads it that way too; the `mapStyle` precedence entry in this release states that change.
- `enableClustering: true` clusters nearby markers. Without the key, the map clusters only above 100 markers, and `false` turns clustering off at any count.
- On `navigation`, `drawer`, `modal` and `popover` open the marker's record. `new_window`, or `openNewTab: true`, opens the record page in a new tab. On a map that no parent view navigates for, a click opens nothing in these cases: the key is absent, the mode is `page`, `none` or `split`, or the block has no `mode`.

The `map` input's description now lists its members. Apart from the `mapStyle` precedence, rendering is unchanged.
