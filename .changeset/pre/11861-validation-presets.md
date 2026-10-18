---
'@object-ui/app-shell': patch
---

Studio's validation-rule "New" menu opens on common rules in plain words, with the rule types under "Advanced" (part of objectui#11861: the validation-rule entry).

"New" in an object's Validations view used to open on the spec's rule types ("Script — CEL fail condition", "Cross-field — CEL over multiple fields", …). It now opens on three starting points, each a rule of a type the spec already has:

- **End date on or after start date** — a `cross_field` rule on the object's first two date fields (its own fields: never a system or hidden one). It is written at once, with its message, and the error attaches to the end date.
- **Number can't be negative** — a `script` rule on the object's first number, currency or percent field, written at once with its message.
- **Reject the save when…** — a `script` rule whose condition the author builds. As with any new rule since objectui#11820, it is not saved until it has a condition, and it opens with the condition editor focused.

Each menu row names the fields it will use. A preset the object has no fields for is listed disabled, saying what it needs. Every condition a preset fills guards each comparison with `!= null`. The server rejects a write whose rule condition cannot be evaluated, and comparing an empty value is such a condition. The guard keeps the rule from rejecting records that leave the field empty. The filled rules open as editable condition rows, not raw CEL.

The per-type list is unchanged, one click away under "Advanced". New rules still start on Create + Update.

"Unique" and "Required when…" are not offered as validation presets. The spec has no uniqueness rule type; it points to a unique index or a field's `unique` instead. "Required when" is a field's own setting (`requiredWhen`), already in the field inspector.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The new copy lives in the metadata-admin designer's own string tables (en and zh).
