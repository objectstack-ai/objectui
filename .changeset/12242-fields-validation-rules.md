---
'@object-ui/fields': minor
---

`buildValidationRules` stops compiling a field-level `pattern` / `pattern_message` and `validate` (objectui#12242, maintainer ruling A). `@objectstack/spec`'s `FieldSchema` refuses all three keys by name, so no published object carries them, and `@object-ui/types` retires them as `never` tombstones.

- FROM: a field metadata object carrying `pattern` (a string or a `RegExp`) produced a `pattern` rule, with `pattern_message` as its message, and one carrying `validate` produced a `validate` rule (on a `location` field, beside the stored-value check).
- TO: neither is read. A `location` field's rule is the stored-value check alone. An `email` or `url` field still gets its own format rule, and `minLength` / `maxLength` / `min` / `max` / `required` are unchanged.

A regex check on an object is its `format` validation rule, `{ type: 'format', name, field, regex, message }`, which the server runs on every write that touches the field and refuses with the rule's `message`. No client pre-check of that rule is added.

`mobile_fullscreen` is typed for `TextAreaField` and `RichTextField` on a package-local hand-off, since the field metadata types no longer declare it, and `LookupField` reads `idField` / `picker` / `subtitle` through `FormField`'s declaration of them. Both are type-only: the widgets read the same keys as before.

## ⚠️ BREAKING, priced as minor under the fixed group's version policy

A host that hand-writes field metadata in code with `pattern` or `validate` loses that client-side check on the form: the value is submitted, and only a `format` rule on the object refuses it, on the server. Declare the check on the object. (The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)
