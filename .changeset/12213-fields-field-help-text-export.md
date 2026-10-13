---
'@object-ui/fields': minor
---

`@object-ui/fields` exports `fieldHelpText(field)`, the one read of the help line a field draws under its control (objectui#12213).

It reads `@objectstack/spec`'s `inlineHelpText`, then `description`, an empty string reading as absent, and never `help`. The record form (`@object-ui/plugin-form`, for `ObjectForm`'s field builder and `fromObjectSchema`) and `resolveActionParam` both call it, so the order has one home. It used to be a package-internal function of `@object-ui/plugin-form`, which `resolveActionParam` cannot import, so the resolver restated the order by hand. Its parameter is typed as `BaseFieldMetadata`'s `inlineHelpText` and `description` members (`@object-ui/types`); a typed literal that also carries `help` does not compile.

**Clause-②: yes**: one export joins this package's public surface, `fieldHelpText`, and the read it carries accepts a field's `inlineHelpText` and `description` only.
