---
'@object-ui/cli': minor
---

chore(cli)!: the generated known-types list drops `spec-report`, which objectui#11440 retired

**BREAKING (authoring):** `KNOWN_SCHEMA_TYPES` (regenerated from the registration calls) no longer lists `spec-report` or its twin `plugin-report:spec-report`. `objectui check` now reports a root document of either type as an unknown type, and `objectui validate` keeps refusing it at `type`, as it already did.

Migration: `{ "type": "spec-report", "report": { … } }` → `{ "type": "report", "report": { … } }`, with the same `report` member. `@object-ui/plugin-report`'s changeset for this change states what each face accepts.

This change takes the registered-types ratchet (`REFUSED_AT_TYPE`) from 1 to 0, and its namespaced twin from 362 to 361.

**Clause-②: yes**, released as `minor` with this banner.
