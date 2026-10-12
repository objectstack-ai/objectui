---
'@object-ui/types': minor
---

The exported field metadata types stop declaring the members `@objectstack/spec`'s `FieldSchema` refuses by name and no reader honours, and two type values become the spec's `FieldType` spellings (objectui#12242). Each retired member is a `?: never` tombstone, the convention `GridFieldMetadata` uses for `min_rows`: a literal carrying it is refused at compile time, and its docblock names what to write instead.

Retired to a spec key, which is now declared by reference:

- `BaseFieldMetadata`: FROM `visible_on?: VisibilityCondition` → TO `visibleWhen`, typed as `@objectstack/spec/data`'s `Field['visibleWhen']`: a CEL predicate string or the spec's `{ dialect, source }` envelope. The spec suggests it by name ("did you mean `visible_on` → `visibleWhen`?"). The old `{ field, operator, value }` object was never drawn as a gate, since the form builders read predicate text only. `VisibilityCondition` is still exported, marked `@deprecated`: no member declares it now.
- `CurrencyFieldMetadata`: FROM `currency?: string` → TO `currencyConfig`, typed as `Field['currencyConfig']`. A fixed currency is `{ currencyMode: 'fixed', defaultCurrency: 'USD' }`; with none, the field shows the tenant's default currency.

Retired with no replacement key (the spec declares no twin, and nothing reads them):

- `BaseFieldMetadata`: FROM `filterable?: boolean` → TO refused.
- `DateFieldMetadata` and `DateTimeFieldMetadata`: FROM `min_date?: string | Date` and `max_date?: string | Date` → TO refused. The spec's `min` / `max` are numbers, and no date widget read either key.
- `LocationFieldMetadata`: FROM `default_zoom?: number` → TO refused.
- `AutoNumberFieldMetadata`: FROM `starting_number?: number` → TO refused. The backend's counter decides where a sequence starts.
- `ObjectFieldMetadata`: FROM `schema?: Record<string, any>` → TO refused. `ObjectField` never read it. The spec declares a JSON value's shape on the object, as a `validations[]` rule of `type: 'json_schema'` naming the field.
- `VectorFieldMetadata`: FROM `normalize?: boolean` → TO refused.

Type values:

- `AutoNumberFieldMetadata.type`: FROM `'auto_number'` → TO `'autonumber'`. `auto_number` is the form's widget key, `field:auto_number`, which `autonumber` already resolves to.
- `ObjectFieldMetadata.type`: FROM `'object'` → TO `'json'`, the spec's free-form JSON type. It already resolves to the same `field:object` editor.

The `date`, `datetime`, `location`, `auto-number`, `object`, `currency` and `vector` field docs pages teach the spec's spellings.

## ⚠️ BREAKING, priced as minor under the fixed group's version policy

TypeScript that writes a retired member, or `type: 'auto_number'` / `type: 'object'`, on an annotated field metadata literal no longer compiles. For `visible_on`, write `visibleWhen` with a CEL predicate. For `currency`, write `currencyConfig: { currencyMode: 'fixed', defaultCurrency }`. Otherwise drop the key. The spec refuses every one of these keys and values by name, so a field written with them could not be published anyway. `field-metadata-family-retired-12242.test.ts` pins each member and both type values, beside the installed spec's own answer. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

**Clause-②: yes**: the authoring face gains `visibleWhen` and `currencyConfig`, turns the members listed above into `never` tombstones, and changes two type values.
