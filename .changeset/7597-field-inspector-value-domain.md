---
'@object-ui/app-shell': minor
---

feat(app-shell): the Object Field inspector authors `valueDomain` on text fields (objectui#7597)

`@objectstack/spec` declares `FieldSchema.valueDomain`: the standard that a
field's written value must belong to (`iana_time_zone`, `iso_4217_currency` or
`iso_3166_alpha2`). The record write path refuses a value outside the domain
with the field error code `value_domain`. The Studio field inspector had no
control for the key, so an author could not declare it there.

The type-specific section now has a **Value domain** select. It appears only
when the field type is in the spec's `VALUE_DOMAIN_FIELD_TYPES`, which today
holds `text` alone. The spec refuses the key on every other type, so the
control never offers a declaration that the save would then reject.

- The members are the spec's own `ValueDomainSchema` vocabulary, in the
  spec's order. Each label is the member followed by the gloss that
  `FieldSchema.valueDomain`'s own description gives it, for example
  `iso_4217_currency (an ISO 4217 alphabetic currency code, uppercase, e.g. CHF)`.
  The labels come from the installed spec, so they are English in every
  designer locale.
- **— None —** removes `valueDomain` from the field definition. The key is
  absent afterwards; the inspector never writes `null` or an empty string,
  both of which the spec refuses.
