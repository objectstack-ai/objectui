---
'@object-ui/cli': minor
---

chore(cli)!: the generated known-types list drops the four node type keys objectui#10859 batch 8 phase 2c retired

**BREAKING (authoring):** `KNOWN_SCHEMA_TYPES` (regenerated from the registration calls) no longer lists `pie-chart`, `donut-chart`, `radar-chart` or `page-header`, nor their namespaced twins (`plugin-charts:pie-chart`, `plugin-charts:donut-chart`, `plugin-charts:radar-chart`, `layout:page-header`, `protocol-placeholder:page-header`). `objectui check` now reports a root document of one of those types as an unknown type, and `objectui validate` keeps refusing it at `type`, as it already did.

Migration:

- `pie-chart` / `donut-chart` / `radar-chart` → `chart` with `chartType: "pie"` / `"donut"` / `"radar"`;
- `page-header` → `page:header`, with `title` / `subtitle` / `actions` in `properties`.

The registered-types ratchet (`REFUSED_AT_TYPE`) falls from 24 to 20, and its namespaced twin from 379 to 374.

**Clause-②: yes**, released as `minor` with this banner.
