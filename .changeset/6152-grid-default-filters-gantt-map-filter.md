---
'@object-ui/types': minor
'@object-ui/core': patch
'@object-ui/plugin-grid': patch
'@object-ui/plugin-map': patch
'@object-ui/plugin-view': patch
---

feat(types)!: `ObjectGridSchema.defaultFilters` and the flat `ObjectGanttSchema` / `ObjectMapSchema` `filter` follow their `@objectstack/spec` rows (objectui#6152, round 10)

Clause-②: yes

`@objectstack/spec` typed `ComponentPropsMap['object-grid'].defaultFilters` as the same
`ViewFilterRule` array as `filter`, `[{ field, operator, value }, ...]`, from 17.6.0 until 18
retired it (see objectui#12030): the legacy fallback `ObjectGrid` read only when `filter` was
absent, refusing the MongoDB-style record, a bare string and the AST tuple array. The `object-gantt` and `object-map` rows type `filter` the same
way. `@object-ui/types` now takes each row's own member by reference, on the TypeScript interface
and on the zod mirror, with no alias window.

**Widened.** `ObjectGridSchema.defaultFilters` was `Record<string, any>` and
`z.record(z.string(), z.any())`, so the zod mirror REFUSED the rule array the row declares. The
flat grid mirror is the source of an `object-view`'s `table` slot, so
`table: { defaultFilters: [{ field: 'status', operator: 'equals', value: 'open' }] }` parsed
there through 17.x, on the tolerant and the strict face and through `safeValidateSchema`; retired
in 18, see objectui#12030: the row's tombstone refuses `defaultFilters` by name, so every value,
the rule array included, is refused there now.

**Narrowed (breaking).**

- The record form of `defaultFilters` is refused: on the interface (a compile error, in an
  `object-view`'s `table` too) and on the zod mirror, at `defaultFilters` (`table.defaultFilters`
  in an `object-view`), with the protocol's own message, which computed the rule array from the
  record's keys through 17.x (since 18, see objectui#12030, it is the retired-key message, which
  names `filter`). Respell
  `defaultFilters: { status: 'open' }` as
  `filter: [{ field: 'status', operator: 'equals', value: 'open' }]`; the rule-array
  `defaultFilters` spelling this entry first offered is retired in 18 too.
- `ObjectGanttSchema.filter` and `ObjectMapSchema.filter` were `any[]` and `z.array(z.any())`, so
  `filter: [['status', '=', 'open']]` type-checked and parsed. Both are the row's rule array now;
  respell the tuple as `[{ field: 'status', operator: 'equals', value: 'open' }]`. These two flat
  types describe the node as the renderers read it: an authored `object-gantt` / `object-map`
  node's `properties` bag is the row itself, which refused the tuple array already.

What did not move: the renderers' reads. `ObjectGrid` lowered `defaultFilters` through the same
`toFilterNode` sink as `filter`, so a rule array there sent the same `$filter` and drew the same
rows as the same array written as `filter` (retired in 18, see objectui#12030: `ObjectGrid` and
`ObjectView` no longer read `defaultFilters`, so a view that still carries it renders unfiltered);
the sink still lowers a record or an AST that reaches `filter` at runtime, and `ObjectGantt` / `ObjectMap` still forward an AST a host composes. The
`@object-ui/core`, `@object-ui/plugin-grid` and `@object-ui/plugin-view` entries are comment
repairs to sentences that called the key `Record<string, any>`. `@object-ui/plugin-grid`,
`@object-ui/plugin-view` and `@object-ui/plugin-map` also carry typed test fixtures re-spelled to
the rule array, and `@object-ui/plugin-grid` a pin of the above through the real renderer (since
18 it pins that `defaultFilters` is not read).
