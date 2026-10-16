---
---

Test-only: the objectui#12393 grouped-grid and `$select` family pins move from `@object-ui/plugin-list` to `@object-ui/app-shell`, which declares both packages, so `plugin-list`'s type-check no longer compiles `plugin-grid` source across a package boundary; no published file changes.
