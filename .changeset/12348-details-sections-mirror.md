---
'@object-ui/types': minor
---

`RecordDetailsComponentProps.sections[]` declares `hideEmpty` (objectui#12348).

`@objectstack/spec` declares `hideEmpty` on the `record:details` section (since 17.3.0), and `RecordDetailsRenderer` already reads it (on unless authored `false`). The published TypeScript type omitted it, so a spec-valid section such as `{ fields: ['phone'], hideEmpty: false }` failed to compile with TS2353 on `hideEmpty`. It now compiles, typed `boolean` like the spec. Nothing changes at runtime.

The section entry's member set now equals the installed spec's: `name`, `label`, `columns`, `group`, `fields`, `hideEmpty`, `collapsible`, `showBorder`, `defaultCollapsed`, `icon`, `description`, `headerColor`, `count`. A key the spec does not declare on the section is still refused on a typed literal.

The `object-grid` `emptyState` describe in the zod mirror now names all four members of the spec's `EmptyStateSchema`, `link` included. The schema itself was already the spec's by reference.
