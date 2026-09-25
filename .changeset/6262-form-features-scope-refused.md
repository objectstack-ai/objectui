---
---

Comment and test only, no package released (objectui#6262). The ruling said form-view predicates may
not name the `features` scope root, and `@objectstack/spec` has refused one at parse since 17.3.0.
`FormPage`'s predicate-scope comment used to describe `features` being empty on `/forms/:name` as an
open asymmetry, and it now points at that rule. A new console pin,
`formViewFeaturesRootRefused-6262.test.ts`, holds the refusal against the installed spec. It uses the
two schemas metadata-admin's `view` gates resolve, `ViewItemSchema` on create and
`ViewMetadataSchema` on edit. It covers field-level and section-level predicates, and a
`current_user.*` control has to parse clean.
