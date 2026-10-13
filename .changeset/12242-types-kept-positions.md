---
'@object-ui/types': minor
---

The field metadata types stop declaring the keys a host writes at runtime and the field-level regex keys, and `geolocation` leaves the `FieldMetadata` union (objectui#12242, second round, maintainer ruling A). `@objectstack/spec`'s `FieldSchema` refuses every one of these keys and the type value by name, so no published object could carry them: the authoring face now describes only what a published object can carry.

Moved off the authoring face (a host writes them; behaviour is unchanged):

- `BaseFieldMetadata`: FROM `mobile_fullscreen?: boolean` → TO not declared. It is the per-field projection of the form-level `ObjectFormSchema.mobile.fullscreenLongText` that `ObjectForm` stamps on a long-text field's carrier. `@object-ui/fields` types it on a package-local hand-off, where its readers are.
- `LookupFieldMetadata`: FROM `idField?: string` → TO not declared.
- `UserFieldMetadata`: FROM `picker?: 'search' | 'default'` and `subtitle?: string[]` → TO not declared.
- `FormField` keeps all three picker keys with the same types: FROM `idField?: LookupFieldMetadata['idField']`, `picker?: UserFieldMetadata['picker']`, `subtitle?: UserFieldMetadata['subtitle']` → TO `idField?: string`, `picker?: 'search' | 'default'`, `subtitle?: string[]`, declared on the entry itself.

Retired as `?: never` tombstones (the spec's regex check is the object's `format` validation rule, `{ type: 'format', name, field, regex, message }`, which the server runs on save):

- `TextFieldMetadata`: FROM `pattern?: string | RegExp` and `pattern_message?: string` → TO refused.
- `BaseFieldMetadata`: FROM `validate?: FieldValidationFunction | FieldConstraints` → TO refused. `FieldValidationFunction` and `FieldConstraints` stay, marked `@deprecated`: no member declares them now.

Type value:

- `FieldMetadata`: FROM a union including `GeolocationFieldMetadata` (`type: 'geolocation'`) → TO a union without it. `geolocation` is not a spec `FieldType`; the spec's map-point type is `location`. `GeolocationFieldMetadata` is still exported, marked `@deprecated`, and the `field:geolocation` widget stays registered.

Not changed: `DateFieldMetadata.dueLike` and `DateTimeFieldMetadata.dueLike`. `@objectstack/spec`'s own source has since declared `dueLike` on `FieldSchema`, ahead of the spec version installed here.

The `text`, `lookup` and `user` field docs pages, the form blocks page and the form plugin page say where each key lives now.

## ⚠️ BREAKING, priced as minor under the fixed group's version policy

TypeScript that writes one of these keys on an annotated field metadata literal, or assigns a `type: 'geolocation'` literal to `FieldMetadata`, no longer compiles. Move `idField` / `picker` / `subtitle` to the form entry (`FormField`) or the action parameter that builds the picker. Declare a regex check on the object as a `format` validation rule. Use `location` for a map point. Drop `mobile_fullscreen`: `ObjectForm` stamps it from `mobile.fullscreenLongText`. `field-metadata-family-retired-12242.test.ts` pins each key and the type value, beside the installed spec's own answer. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

**Clause-②: yes**: the authoring face loses four members, turns three into `never` tombstones and drops one union member; `FormField` keeps its three picker keys at the same types.
