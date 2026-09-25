---
'@object-ui/core': minor
---

⚠️ **BREAKING — `@object-ui/core` no longer exports `ValidationEngine`,
`defaultValidationEngine`, `validate` or `validateFields` (objectui#7659).**

Those four names were the whole public surface of `validation-engine.js`, a
client-side field-rule engine with a snake_case rule vocabulary of its own
(`min_length`, `max_length`, `email`, `url`, `phone`, `date_min`, `min_items`,
`field_match`, `field_compare`, …). It was a second vocabulary for a job
`buildValidationRules` already does, and no renderer in this repository ever
consumed it: a `validateFields` call compiled, ran, and changed nothing about a
form. It is retired under ADR-0049 enforce-or-remove (maintainer ruling A on
objectui#7659), with no deprecation window, and the module is deleted.

**Replacement:** client-side field validation is `buildValidationRules(field)`
from `@object-ui/fields`. It compiles a field's metadata (`required`, length and
value bounds, `pattern`, and the checks its type implies) into react-hook-form
rules, which the object form renderers apply. There is no one-to-one port of an
`AdvancedValidationSchema` object: a host that called `validate` or
`validateFields` declares those constraints on the field metadata instead, or
keeps its own check.

Not affected: the deprecated object-level engine (`ObjectValidationEngine`,
`defaultObjectValidationEngine`, `validateRecord`, #3110) and the schema-tree
validator (`validateSchema`, `assertValidSchema`) stay exported. The rule and
result types in `@object-ui/types` (`AdvancedValidationSchema`,
`ValidationRuleType`, `ValidationContext`, …) keep their shapes; only the doc
comment on `ValidationContext.locale` changed, because the engine it described
is gone.

⚠️ Out-of-repository consumers are NOT MEASURED. This package is published, and
the zero-consumer reading behind the ruling covers this repository only; a host
application that imports any of the four names stops compiling on upgrade.
