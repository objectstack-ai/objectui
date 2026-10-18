---
'@object-ui/app-shell': minor
---

The metadata-admin designer reads and writes the form-view visibility predicate as `visibleWhen` only (objectui#12696). **BREAKING** for a host that still spells the retired `visibleOn` on a form layout it hands to `SchemaForm`.

`@objectstack/spec` 18 retires the form view's `visibleOn` (ADR-0089), and the console form page and `@object-ui/plugin-form` already stopped reading it (objectui#12654). The designer was the last reader and writer:

- **`SchemaForm` no longer folds `visibleOn` into `visibleWhen`.** A FormView section, a section field, a record-editor sub-field or a raw JSONSchema property that carries only `visibleOn` is now shown unconditionally, as it is in the runtime form. `visibleWhen` hides and shows exactly as before.
- **`FormFieldSpec` and `FormSectionSpec` drop their `visibleOn` member.** Both types are exported from the `@object-ui/app-shell` entry. A typed object literal that sets `visibleOn` on either one no longer compiles.
- **The view create form writes `visibleWhen`.** Its `kind` and `formType` layout pickers still show only for their own `viewKind`.
- **A property named `visibleOn` no longer gets the condition builder by name.** No form the bundled spec ships declares one. A `*When` property still does.

Clause-②: no (narrowing). One member is removed from each of two exported types, and `SchemaForm` honours one fewer input key. Nothing is added and no accepted input widens.

The fix for an affected host is one rename: write `visibleWhen` where it wrote `visibleOn`. The predicate value keeps the same shape.
