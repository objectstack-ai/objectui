---
'@object-ui/cli': minor
---

chore(cli)!: the generated known-types list drops the two node type keys objectui#11441 retired

**BREAKING (authoring):** `KNOWN_SCHEMA_TYPES` (regenerated from the registration calls) no longer lists `navigation-renderer` or `responsive-grid`, nor their namespaced twins `layout:navigation-renderer` and `layout:responsive-grid`. `objectui check` now reports a root document of one of those types as an unknown type, and `objectui validate` keeps refusing it at `type`, as it already did.

Migration:

- `responsive-grid` → `grid`, with the same breakpoint `columns` object and `gap`;
- `navigation-renderer` → the app document's `navigation` items (`{ "type": "app", "name": N, "navigation": [...] }`), drawn by the shell.

The registered-types ratchet (`REFUSED_AT_TYPE`) falls from 20 to 18, and its namespaced twin from 374 to 372.

**Clause-②: yes**, released as `minor` with this banner.
