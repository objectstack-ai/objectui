---
'@object-ui/types': minor
---

fix(types)!: a `filter-builder` `value` is a filter group only, and `defaultValue` is retired (objectui#10825)

⚠️ **BREAKING (authoring)**, marked `minor` under this repository's version-alignment rule (a `major` in the fixed group would move all of it off the `@objectstack` major). A `filter-builder` node that authors a bare condition as its `value`, or that authors `defaultValue` at all, now FAILS to validate, and a TypeScript literal that authors `defaultValue` no longer compiles.

**Clause-②: yes (narrowing)** — an authorable key of `FilterBuilderSchema` stops accepting a bare condition, and `defaultValue` retires on both published faces.

- **`value` takes a group only.** The zod mirror took `union([condition, group])` while the TypeScript face declares `value?: FilterGroup`, so the validator was wider than the published type. A bare condition `{ id, field, operator, value }` validated, and `FilterBuilder` then drew an empty builder: its `isValidGroup` gate needs `logic` and `conditions`, so it fell back to its empty group with no error, and the condition was lost. The mirror now follows the published type. A value that carries a condition's own `field` or `operator` and no `conditions` is refused by name: ONE `custom` issue at `value`, whose message says to wrap it in `{ logic, conditions: [ … ] }`. That message is also the published description of `value`. Every other value is judged by `FilterGroupSchema`, as a group always was.
- **Group refusals are reported where they are.** With the condition arm gone, `value` is no longer a union, so a refusal inside a group is reported at its own path: an id-less row is `invalid_type` at `value.conditions.0.id`, where it used to be one `invalid_union` at `value`.
- **`defaultValue` is retired.** Nothing read it: the `filter-builder` registration hands `FilterBuilder` `schema.value || props.value`, and `FilterBuilder` has no `defaultValue` prop. Measured through the real `SchemaRenderer`, a group authored as `defaultValue` drew the same empty builder as a node with no filter key at all. It is a `?: never` tombstone on the TypeScript face and a `retirementTombstone()` arm on the mirror, an `invalid_type` issue at the key whose message points at `value`. It stays declared because the node is `.passthrough()`, so a deleted key would be kept in silence.

**Migration:** wrap a bare condition in a group, `{ "logic": "and", "conditions": [ … ] }`, with the condition as its one row, and author a `defaultValue` group as `value` instead. A one-time reading on the pull request, not re-derived here: every `filter-builder` node authored in this repository's examples and docs already writes a group as `value`, and none writes `defaultValue`. Stored tenant metadata was not measured (it cannot be read from this repository); a bare-condition `value` there draws an empty builder today and is refused on its next validation.

Pinned in `packages/types/src/__tests__/filter-builder-value-group-only-10825.test.ts`.
