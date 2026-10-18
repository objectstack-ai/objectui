---
'@object-ui/types': minor
---

A form view's `subforms[].columns` entry is judged by `@objectstack/spec`'s `InlineGridColumnSchema` now, by reference, so `objectui validate` and `os validate` give one verdict on a column (objectui#11266).

BREAKING (`@object-ui/types`): the accept set of the tolerant face narrows. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

`@objectstack/spec` 17.6.0 holds `FormViewSchema.subforms[].columns` to its closed inline grid column schema (objectstack-ai/objectstack#20927). The `object-form` mirror still read `z.array(z.any())` there, so `objectui validate` accepted columns that `os validate` refuses.

What each face does now:

- **zod (`@object-ui/types/zod`).** NARROWS on the tolerant face (`safeValidateSchema`, which `objectui validate` runs) and on the strict authoring face, wherever `subforms` is read: the object-view `form` slot and the `object-form` mirror. A column with an undeclared key is refused at the column, with one `unrecognized_keys` issue naming the key. A column that declares `type: 'currency'` and carries `scale` is refused at that `scale`, in the spec's own words. A bare field-name string is refused at the column with `invalid_type`. Each verdict is the spec schema's, because the column is handed to it.
- **TypeScript.** A `subforms[].columns` entry on `ObjectFormSchema` (and so on `ObjectViewSchema['form']`) is `InlineGridColumn` from `@objectstack/spec/data`, by reference, where it was `any`. A string column no longer compiles, and neither does an object literal with an undeclared column key.

**Migration.**

- FROM `columns: ['product', 'quantity']` → TO `columns: [{ name: 'product' }, { name: 'quantity' }]`
- FROM a column carrying a key `InlineGridColumn` does not declare → TO the same column without that key. A column that declares no `type` takes its label, type and the rest from the child object's field.
- FROM `{ name: 'amount', type: 'currency', scale: 2 }` → TO `{ name: 'amount', type: 'currency' }`. A currency amount's decimal places come from its currency's minor unit, not from the column.

Not refused here: a `scale` on a column that declares no `type` (`{ name: 'amount', scale: 2 }`) when its child field is a currency. Seeing that takes the child object's fields, which are not in the document the validator judges. `defineStack` refuses it at publish, and the master-detail form reports it at render.

The parse output is the spec schema's too: a column `readonlyWhen` or `requiredWhen` written as a string comes back from `safeValidateSchema` as the spec's `{ dialect: 'cel', source }` envelope. The document you pass in is not changed.

**Clause-②: yes (narrowing)**: a `subforms[].columns` entry that is not a valid `InlineGridColumn` used to parse with its value kept, and is now refused at the column.
