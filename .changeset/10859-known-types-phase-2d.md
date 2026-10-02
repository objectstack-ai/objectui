---
'@object-ui/cli': minor
---

chore(cli)!: the generated known-types list drops the ten `sidebar-*` node type keys objectui#10859 batch 8 phase 2d retired

**BREAKING (authoring):** `KNOWN_SCHEMA_TYPES` (regenerated from the registration calls) no longer lists `sidebar-provider`, `sidebar-header`, `sidebar-content`, `sidebar-group`, `sidebar-menu`, `sidebar-menu-item`, `sidebar-menu-button`, `sidebar-footer`, `sidebar-inset` or `sidebar-trigger`, nor their `ui:` twins. `objectui check` now reports a root document of one of those types as an unknown type, and `objectui validate` keeps refusing it at `type`, as it already did.

Migration: author the `sidebar` node, which now mounts its own provider when its host has none, and put the parts' content in its `children`. `@object-ui/components`' changeset for this phase lists the move per spelling.

objectui#11441 retired its two layout keys first, so on that base this change takes the registered-types ratchet (`REFUSED_AT_TYPE`) from 18 to 8, and its namespaced twin from 372 to 362.

**Clause-②: yes**, released as `minor` with this banner.
