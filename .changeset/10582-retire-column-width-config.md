---
'@object-ui/types': minor
'@object-ui/plugin-kanban': minor
---

**BREAKING (scored `minor` per this repo's version-alignment convention)** —
`ColumnWidthConfig` and its Zod mirror `ColumnWidthConfigSchema` are deleted
(objectui#10582, ADR-0049 enforce-or-remove). No schema key references the
type and nothing reads it, so a `ColumnWidthConfig` an author built was never
read by anything.

**Why nothing was behind it.** The one key that carried the type, the
`'kanban'` arm's `columnWidths`, retired with that arm in this release
(objectui#8802). The one reader, the `useColumnWidths` hook in
`@object-ui/plugin-kanban`, was removed in this release too (objectui#8522).

**What each package's published entry loses**, read off the 17.6.0 tarballs on
npm:

- `@object-ui/plugin-kanban`: 17.6.0 exports `ColumnWidthConfig` from its
  entry. There it is the package's own declaration, and `KanbanSchema` types
  its `columnWidths` member with it. This release exports it no more.
- `@object-ui/types`: 17.6.0 exports neither `ColumnWidthConfig` nor
  `ColumnWidthConfigSchema`. Both entered this package in this release, when
  objectui#7664 moved the kanban dialect's declarations here, and both leave
  before any version publishes them. For these two names, the objectui#7664
  entries in this release are superseded by this one.

## Migration

- `import type { ColumnWidthConfig } from '@object-ui/plugin-kanban'` no
  longer resolves: TypeScript reports that the module has no exported member of
  that name. Delete the import and the annotation that used it. Nothing
  replaces the type, and removing it changes nothing at runtime, because a type
  import is erased at compile time.
- The objectui#8522 entry in this same release says `ColumnWidthConfig` stays
  exported from `@object-ui/types` and from `@object-ui/plugin-kanban`. That
  was true of that change. This entry removes it from both.
