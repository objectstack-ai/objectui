---
'@object-ui/types': minor
---

`BaseFieldMetadata` declares a field's help text as `inlineHelpText`, typed by reference to `@objectstack/spec`'s `FieldSchema.inlineHelpText`, and no longer declares `help` (objectui#12213).

- FROM `help?: string` → TO `inlineHelpText`, typed as `@objectstack/spec/data`'s `Field['inlineHelpText']` (a string): "Help text displayed below the field in forms". It is the key Studio's object field inspector writes, and the record form now draws it under the field's control (`@object-ui/plugin-form`).

Every field metadata type extends `BaseFieldMetadata`, so the change reaches all of them. The `auto-number`, `file`, `object` and `text` field docs pages teach `inlineHelpText` in place of `help`.

## ⚠️ BREAKING, priced as minor under the fixed group's version policy

TypeScript that writes `help` on a field metadata literal no longer compiles: an excess-property error names the key. The spec's `FieldSchema` refuses `help` by name and suggests `inlineHelpText`, so a field written that way could not be published anyway. Rename `help` to `inlineHelpText`; the value stays the same. `field-metadata-inline-help-text-12213.test.ts` pins both directions. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

**Clause-②: yes**: the authoring face gains `inlineHelpText` and loses `help`.
