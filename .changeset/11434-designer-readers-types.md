---
'@object-ui/types': minor
---

**BREAKING (authoring)** — `DataModelRelationship.onDelete` is respelled `deleteBehavior`, in `@objectstack/spec`'s vocabulary, on both faces; and the process designer's last two unmirrored members are mirrored (objectui#11434, ADR-0049).

**Clause-②: yes** — one authorable member of a published `@object-ui/types` declaration narrows to `never` (`onDelete`), beside widenings (`deleteBehavior`, and `lanes` / `version` on the zod arm). Scored `minor`, not `major`: this repository scores its own breaking changes `minor` and spells the breaking semantics out in the body (`check:changeset-no-major`).

**Why.** objectui#11434 ruled the data-model and process designers' declared-and-unread members READ, and their readers ship in `@object-ui/plugin-designer` in this release. One of them carried its own spelling: the designer's `onDelete`, with the literals `'cascade' | 'set-null' | 'restrict' | 'no-action'`, while the platform spells the referential action `deleteBehavior` on a relationship field, with `'set_null' | 'cascade' | 'restrict'`. Nothing read `onDelete`, and nothing outside one test fixture authored it, so the seat ruled it respelled rather than given a reader under the old name.

**What changes.**

- `DataModelRelationship.deleteBehavior` is declared on both faces. The TypeScript face reads its type off `@objectstack/spec`'s `Field['deleteBehavior']`, so the two cannot drift; the zod face restates the three values. `DataModelDesigner` draws it.
- `DataModelRelationship.onDelete` is a `?: never` tombstone on the TypeScript face, so `tsc` refuses it by name. On the zod face `safeValidateSchema`, the strict authoring face and `objectui validate` refuse it by name with the spec's own sentence ("Did you mean `onDelete` → `deleteBehavior`?") and the migration below. Before this change both faces accepted it.
- `ProcessDesignerSchema.version` and `.lanes` are mirrored on the `process-designer` arm, with a new `BPMNLaneSchema` record mirror exported from `@object-ui/types/zod`. The strict face refused both as unrecognized keys before, and accepts them now; a lane's `id`, `label`, `role` and `nodeIds` are judged. The TypeScript face already declared both and is unchanged.

**Migration.**

- `DataModelRelationship.onDelete`: rename the key to `deleteBehavior`. `'cascade'` and `'restrict'` keep their values, `'set-null'` becomes `'set_null'`, and `'no-action'` becomes `'restrict'` (the platform has no separate no-action; both refuse the delete while a reference remains).

```ts
// before: compiled, and nothing drew it
const rel: DataModelRelationship = { id: 'r', sourceEntity: 'account', sourceField: 'id', targetEntity: 'contact', targetField: 'account_id', type: 'one-to-many', onDelete: 'set-null' };

// after: the platform's spelling, which the designer draws
const respelled: DataModelRelationship = { id: 'r', sourceEntity: 'account', sourceField: 'id', targetEntity: 'contact', targetField: 'account_id', type: 'one-to-many', deleteBehavior: 'set_null' };
```

⚠️ **The census behind "nothing authored it" is the in-repo half.** Every package, app, example, doc and skill in this repository, and the ObjectStack framework, was searched: one test fixture authored `onDelete`, and nothing else. Customer applications and documents outside both were not enumerated. A TypeScript consumer that authored the key gets a compile error naming it.
