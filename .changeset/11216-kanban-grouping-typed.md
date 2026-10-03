---
'@object-ui/types': minor
---

`ObjectKanbanSchema.grouping` is declared on both faces, as `@objectstack/spec`'s `GroupingConfig`, by reference (objectui#11216).

The spec's `object-kanban` row types `grouping` as the list view's own `GroupingConfigSchema`. `ObjectKanban` reads `grouping.fields[0].field` as the fallback for `swimlaneField`. Until this change the key was undeclared on the `object-kanban` arm, so this package and the spec gave three different answers for one document:

| `grouping` value | spec row | strict authoring face (before → now) | tolerant face (before → now) |
|---|---|---|---|
| `{ fields: [{ field: 'owner' }] }` | accepted | refused by name → **accepted** | kept → accepted, kept as authored |
| a padded field name, `{ fields: [{ field: '  x  ' }] }` | refused | refused by name → refused at `fields.0.field` | kept → **refused** |
| a bare string, `'owner'` | refused | refused by name → refused at `grouping` | kept → **refused** |
| an empty list, `{ fields: [] }` | refused | refused by name → refused at `fields` | kept → **refused** |
| an undeclared key on the block or on an entry | refused | refused by name → refused by name inside the block | kept → **refused** |

- **Zod mirror.** `grouping: stripImportedDefaults(GroupingConfigSchema).optional()`, which is how `ObjectGridSchema.grouping` spells it. The spec's `order` and `collapsed` defaults are not added to a parsed document.
- **TypeScript.** `grouping?: GroupingConfig`, the spec's authored type. It is the same type as the `object-kanban` row's `grouping`.

**Not changed: the board.** `ObjectKanban` reads `fields[0].field` and nothing else in the block. The registration's input description says so, and it is unchanged.

**Migration.** Write `grouping` as `{ fields: [{ field }] }` with an unpadded field name, or delete it and author `swimlaneField`, which the board reads first.

**minor, not patch.** The member is new in the shipped `.d.ts` and in the zod mirror's `.shape`. The tolerant face now refuses the shapes in the table that it used to keep unjudged.
