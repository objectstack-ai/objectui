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

⚠️ **Dated note, 2026-10-02 — `grid` takes column counts 1 to 12, not any number — objectui#11491.** At this change "the same breakpoint `columns` object" carried any count; now each count in a `grid`'s `columns` is one of 1 to 12, the counts the `grid` renderer maps, and `objectui validate` refuses any other with that set named. Every count `ResponsiveGrid` drew (1, 2, 3, 4, 6 and 12) is one of them, so the migration above holds for every `responsive-grid` that drew its columns. `.changeset/11491-grid-columns-set.md` states what ships. The rest of this entry is kept as the reading of this change.

⚠️ **Dated note, 2026-10-02 — `grid` takes one of ten `gap` steps, not any number — objectui#11474.** At this change "the same breakpoint `columns` object and `gap`" carried any `gap` number; now `grid`'s `gap` is one of 0, 1, 2, 3, 4, 5, 6, 8, 10 and 12, the steps the `grid` renderer maps, and `objectui validate` refuses any other with that set named. Every step `ResponsiveGrid`'s own class map drew (0 to 6 and 8) is one of them, so the migration above holds for every `responsive-grid` whose `gap` drew a class. `.changeset/11474-layout-spacing-sets.md` states what ships. The rest of this entry is kept as the reading of this change.
