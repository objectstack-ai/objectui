---
'@object-ui/cli': minor
---

chore(cli)!: the generated known-types list drops the thirty node type keys objectui#10859 batch 8 retired

**BREAKING (authoring):** `KNOWN_SCHEMA_TYPES` (`packages/cli/src/utils/known-schema-types.ts`, regenerated from the registration calls) no longer lists the 28 bare field-widget fallbacks retired in `@object-ui/fields`, nor `tree` / `view:tree` (`@object-ui/plugin-tree`) or `view` / `plugin-view:view` (`@object-ui/plugin-view`). `objectui check` now reports a root document of one of those types as an unknown type, and `objectui validate` keeps refusing it at `type`, as it already did.

Migration:

- a root `type` naming one of the 28 field types → write the field inside a form's `fields[]`; the widget is `field:<type>`;
- `tree` → `object-tree`;
- `view` → `object-view`.

The registered-types ratchet (`REFUSED_AT_TYPE`) falls from 66 to 36, and its namespaced twin from 391 to 389.

**Clause-②: yes**, released as `minor` with this banner.
