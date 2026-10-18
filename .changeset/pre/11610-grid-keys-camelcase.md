---
'@object-ui/types': minor
'@object-ui/fields': minor
---

The `grid` field's eight field-level keys are camelCase now, and their snake_case spellings are retired and refused by name on every face (objectui#11610).

BREAKING (`@object-ui/types`, `@object-ui/fields`): a `grid` field's metadata, and a `form` `fields[]` entry of `type: 'grid'`, must spell these keys in camelCase. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

- FROM `min_rows` → TO `minRows`
- FROM `max_rows` → TO `maxRows`
- FROM `allow_add` → TO `allowAdd`
- FROM `allow_delete` → TO `allowDelete`
- FROM `allow_reorder` → TO `allowReorder`
- FROM `total_field` → TO `totalField`
- FROM `add_label` → TO `addLabel`
- FROM `sort_field` → TO `sortField`

Why: `@objectstack/spec`'s runtime form field declares config keys in camelCase only, so it could not declare these keys as they were written (objectstack-ai/objectstack#21704, fork 2, ruled B). There is no alias window and no dual read: no reader reads the snake_case spellings any more, and no stored producer outside this repository's own fixtures, which move with this change, was found to write them.

**Migration.** Rename each key; its value stays the same. `totalField` keeps its meaning: the CHILD column summed into the grid's footer, which is the value a spec `amountField` carries. It is not the parent field the spec's own `totalField` names on a master-detail subform.

What each face does with a snake_case key now:

- **TypeScript.** `GridFieldMetadata` and `FormField` declare each as a `never` member, so an authored value no longer compiles. The camelCase members carry the value types the snake_case members had, and `FormField` still takes each one by reference to `GridFieldMetadata`.
- **zod (`@object-ui/types/zod`).** NARROWS on the tolerant face (`safeValidateSchema`, which `objectui validate` runs) and on the strict authoring face: a form field entry carrying a snake_case key used to parse with the value kept, and is now refused with one `invalid_type` issue at that key. The message leads with ``Did you mean `min_rows` → `minRows`?`` (each key names its own replacement). WIDENS on both faces: the camelCase keys parse, judged by the same value types.
- **The `grid` widget (`@object-ui/fields`).** `GridField` reads the camelCase keys only. A field whose metadata still carries a snake_case key is drawn as an inline alert naming each retired key beside its replacement (`role="alert"`, `data-testid="grid-field-retired-keys"`) instead of the grid, and the same text goes to `console.error` once. Nothing is thrown, so the rest of the form still draws, and the rows are not changed.

New export from `@object-ui/types`: `GRID_FIELD_RETIRED_KEYS`, the snake_case to camelCase map that the zod refusals and the widget both read, with its key type `GridFieldRetiredKey`.

`@object-ui/plugin-form`'s master-detail and line-items adapters now hand the grid the camelCase keys, typed against `GridFieldMetadata` instead of cast through `any`. What they draw does not change.

**Clause-②: yes (narrowing)**: the camelCase spellings widen each face, and the snake_case spellings narrow it.
