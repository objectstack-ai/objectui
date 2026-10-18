---
'@object-ui/types': minor
---

A form field declares `scale` and `currencyConfig` on both faces, by reference to `@objectstack/spec`'s `FieldSchema`, so the strict authoring face accepts the decimal places and the fixed currency the field widgets read (objectui#11070).

A hand-authored `form` hands each field widget the `fields[]` entry itself as its metadata carrier. The `number`, `percent`, `formula` and `summary` widgets read `scale` off it, and the `currency` widget reads `currencyConfig` through `resolveFieldCurrency`. Both keys always drew; only the declarations were missing. Each is now the spec member itself, value checks included.

- **TypeScript.** `FormField` gains `scale?: SpecField['scale']` and `currencyConfig?: SpecField['currencyConfig']`. Both used to fall to the index signature's `any`. A typed literal with a value of the wrong type (a string `scale`, a `currencyMode` outside `fixed` / `dynamic`) is now a compile error.
- **zod (`@object-ui/types/zod`).** WIDENS on the strict authoring face (`StrictAnyComponentSchema`): `fields[].scale` and `fields[].currencyConfig` used to be refused with `unrecognized_keys`, and now parse. NARROWS on the tolerant face (`safeValidateSchema`), where both keys used to be stripped unjudged: a `scale` that is not a whole number from 0 to 100 is now refused, and so is a `currencyConfig` the spec refuses (a `currencyMode` outside `fixed` / `dynamic`, a `defaultCurrency` that is not three characters, or a member the spec's config does not declare, such as the removed `precision`). The values are now kept. No spec default (`dynamic`, `CNY`) is written into the document.
- **`scale` on a `currency` field is refused, on both faces.** The spec's `FieldSchema` refuses it there (objectstack-ai/objectstack#19629): an amount's decimal places are its currency's ISO 4217 minor unit. The `currency` widget never read it. The rule is keyed on `type`, as the spec keys it, and the refusal is the spec's own text. This is the only one of the spec's cross-key rules this face carries. The others (`rows`, `minLength` / `maxLength`, `multiple`) key on the spec's field-type sets, and a form field's `type` is a widget id (`input`, `select`, …) those sets do not hold.
- **Not declared: `currency` on a form field.** The spec's `FieldSchema` refuses it as a field key, so the strict face still refuses it. `resolveFieldCurrency` still reads it at runtime. Declare a fixed currency as `currencyConfig: { currencyMode: 'fixed', defaultCurrency: 'EUR' }`.

BREAKING (`@object-ui/types`), for a document whose form field carries a `scale` or a `currencyConfig` the spec refuses, or a `scale` on a `currency` field: it no longer validates on the tolerant face. Fix the value, or delete `scale` from the `currency` field. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

**Clause-②: yes (widening)**: both keys widen the strict face, and their spec value checks, plus the spec's `currency` rule on `scale`, narrow the tolerant face.
