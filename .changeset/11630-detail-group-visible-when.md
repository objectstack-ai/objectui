---
'@object-ui/plugin-detail': minor
---

A field group's `visibleWhen` now gates its section on the record detail page the way it gates the section on the entry form (objectui#11630). On an object whose `fieldGroups` entry declares `visibleWhen: "record.kind == 'pro'"`, the edit form hid the "Pro details" section on a `basic` row while the detail page drew it, header included, on every row. The detail page now draws it only where the predicate holds.

**How it is evaluated.** `record:details` evaluates the predicate per record with the form's own evaluator, `resolveFieldRuleState` from `@object-ui/core`, under the host predicate scope (`usePredicateScope`). Both spellings behave as on the form: a bare CEL string and a `{ dialect: 'cel', source }` envelope. Values bind under `record.`, so a bare identifier is unbound. A declared field the row does not carry compares as `null`. A relation binds as its stored id even when the page's record arrived expanded, and `previous` binds the persisted row, as on that record's edit form. A predicate that cannot be evaluated SHOWS the section and warns once, which is what the form does. A FALSE verdict removes the whole section, heading and members. It is display only: the record API serves those fields either way.

**Clause-②: yes (widening)**: published output gains one emitted key, and nothing else changes on the package entry.

- `deriveFieldGroupDetailSections` returns a section carrying `visibleWhen` (verbatim, unevaluated) when its group declares one. The function's declared return type (`Array<Record<string, any>> | null`) is unchanged, so no type member is added.
- The same key therefore appears on the `record:details` node's `properties.sections[]` that `buildDefaultPageSchema`, `buildDefaultTabs`, `buildDefaultDetails` and `resolveDetailSections` emit, and on a page Studio seeds from `buildDefaultPageSchema`.
- `record:details` reads `sections[].visibleWhen` and drops a section whose verdict is FALSE. An authored `{ group }` reference inherits the group's predicate this way, which is what `@objectstack/spec` documents for that reference form.

Not widened: no TypeScript member, zod member, registered `inputs` entry or i18n key. `@objectstack/spec`'s `RecordDetailsProps.sections[]` refuses `visibleWhen` on parse (`unrecognized_keys`), so `RecordDetailsComponentProps.sections[]` and the block's registered inputs still do not name it. To gate a section on a hand-authored page, gate the field group and reference it with `{ group }`.
