---
'@object-ui/cli': minor
---

chore(cli)!: the generated known-types list drops the twelve node type keys objectui#10859 batch 8 phase 2b retired

**BREAKING (authoring):** `KNOWN_SCHEMA_TYPES` (regenerated from the registration calls) no longer lists `scatter-chart`, `dashboard-grid`, `form-analytics`, `import-wizard`, `shared-view-link`, `app-creation-wizard`, `branding-editor`, `dashboard-editor`, `navigation-designer` or `related-list`, nor their namespaced twins, and no longer lists the bare `metric` / `metric-card` (their `plugin-dashboard:` keys stay). `objectui check` now reports a root document of one of those types as an unknown type, and `objectui validate` keeps refusing it at `type`, as it already did.

Migration:

- `scatter-chart` → `chart` with `chartType: "scatter"`;
- `dashboard-grid` → `dashboard`;
- `related-list` → `record:related_list`;
- `metric` / `metric-card` as a standalone node → `plugin-dashboard:metric` / `plugin-dashboard:metric-card` (inside a dashboard, keep the widget spelling);
- `form-analytics`, `import-wizard`, `shared-view-link`, `app-creation-wizard`, `branding-editor`, `dashboard-editor`, `navigation-designer` → mount the exported React component directly.

The registered-types ratchet (`REFUSED_AT_TYPE`) falls from 36 to 24, and its namespaced twin from 389 to 379.

**Clause-②: yes**, released as `minor` with this banner.
