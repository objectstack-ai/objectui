---
'@object-ui/types': minor
---

⚠️ **BREAKING (scored `minor` per this repository's version-alignment
convention) — `@object-ui/types` no longer exports the eight "Phase 3.5"
validation types (objectui#10719).**

Removed from the package root: `AdvancedValidationSchema`,
`AdvancedValidationRule`, `ValidationRuleType`, `ValidationFunction`,
`AsyncValidationFunction`, `ValidationContext`, `AdvancedValidationResult` and
`AdvancedValidationError`.

They were the type half of `@object-ui/core`'s `ValidationEngine`, a client-side
field-rule engine with a snake_case rule vocabulary of its own. That engine was
retired under ADR-0049 enforce-or-remove (maintainer ruling A on objectui#7659),
and the same reason covers its types: nothing in this repository or in the
ObjectStack framework reads them. They are removed with no deprecation window.

**Replacement:** client-side field validation is declared on the field. A form
field's `validation` key is typed `FieldValidationRules`, whose `validate`
member takes a custom check, and `buildValidationRules(field)` from
`@object-ui/fields` compiles field metadata (`required`, length and value
bounds, `pattern`, and the checks a field's type implies) into react-hook-form
rules. There is no one-to-one port of an `AdvancedValidationSchema` object: a
host that typed its own rules with these names declares those constraints on
the field metadata instead, or keeps its own types.

Not affected: `FieldValidationRules`, `FieldValidationFunction`, the
object-level rule union `ObjectValidationRule` and its variants, and
`DesignerValidationRule` stay exported.

⚠️ Out-of-repository consumers are NOT MEASURED. This package is published, and
the zero-reader reading behind the ruling covers this repository and the
ObjectStack framework only; a host application that imports any of the eight
names stops compiling on upgrade.
