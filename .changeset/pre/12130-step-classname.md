---
'@object-ui/types': minor
'@object-ui/components': minor
'@object-ui/plugin-form': patch
---

A form field declares `step` and `className` on both faces, so the strict authoring face stops telling authors to remove two keys that work. A built-in form branch now joins an entry's `className` with its own classes, and the form renderer's own number input derives its step, so `ObjectForm` no longer writes `step: 'any'` (objectui#12130).

These were the last two keys the form-field channel census (`form-field-channel-census-12130.test.tsx` in `examples/schema-catalog/test/`) listed as read and undeclared with the question open. Each is measured through the real `SchemaRenderer`, with and without the key, in `form-field-channel-effects-12130.test.tsx` beside it.

- **`step`, declared by reference to `@objectstack/spec`'s `FieldSchema.step`:** a number. The `number` widget and the form renderer's own number input put it on the `<input>`; the `slider` widget steps by it.
- **The form renderer's own number input (`@object-ui/components`).** The built-in `input` branch, and the default branch for an unregistered widget, draw a native number input under `inputType: 'number'`. Its step now follows the `number` widget's rule, read off the field's metadata: an explicit `step` wins, else `10^-scale`, else `any`. Before, it took only a `step` written on the entry, and with none the input kept HTML's step of 1, which refuses decimals. An entry with `inputType: 'number'` and neither `step` nor `scale` now accepts decimals. On an `ObjectForm` field drawn by that input (`widget: 'input'`), a `step` the object field declares now wins over `scale`, as it always did in the `number` widget.
- **`ObjectForm` (`@object-ui/plugin-form`) no longer writes `step`** onto the number, currency and percent fields it builds. It wrote `10^-scale`, or `'any'` with no `scale`, and the spec's numeric `step` refuses `'any'`. Both routes `objectFormNumericStep-9574.test.tsx` measures render the same steps as before, and that pin passes unchanged.
- **`className`, declared as a string:** the classes of the element the field's type renders. That is the control on a built-in branch, the element a registered field widget renders, or a `section-divider` row's divider. It is never the field row; a field's width is `colSpan` / `span`. Some widgets draw no class from it, and most read-only displays draw none.
- **Built-in branches merge it (`@object-ui/components`).** The `input`, `textarea`, `checkbox` and `switch` branches and the unregistered-widget default used to let an entry's `className` replace their own classes, which dropped the touch-target height and the read-only tint. They now join the two with `cn`, as the built-in `select` already did, so a conflicting utility in `className` still wins.
- **TypeScript.** `FormField` gains both members. `step` is `number`, so assigning `'any'` is now a compile error.
- **zod (`@object-ui/types/zod`).** WIDENS on the strict authoring face (`StrictAnyComponentSchema`): both keys used to be refused with `unrecognized_keys`, and now parse, `step` as a number. NARROWS on the tolerant face (`safeValidateSchema`), where both keys used to be stripped unjudged. `step: 'any'` was accepted and dropped there, and is now refused at `fields[].step`. A non-string `className` is now refused too. The face is flat: both keys are accepted on every field type.

BREAKING (`@object-ui/types`), for a document whose form field carries `step: 'any'` or a non-number `step`, or a non-string `className`: it no longer validates on the tolerant face. Delete `step: 'any'` (a number input with no `step` and no `scale` already steps by `any`), or write a number. (The bumps are `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

**Clause-②: yes (narrowing)**: the two declared keys widen the strict face's accept set. Typing `step` as the spec's number narrows the tolerant face, from accepting `step: 'any'` (stripped) to refusing it at `fields[].step`.
