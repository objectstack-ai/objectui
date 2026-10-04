---
'@object-ui/plugin-form': minor
'@object-ui/types': minor
---

The default (`simple`) `object-form` draws a self-describing inline section entry, as the `tabbed`, `wizard`, `split`, `drawer` and `modal` forms already did (objectui#11615). Before, the default form resolved every section entry against its parent field pool and skipped an inline `{ name, … }` entry whose name the pool did not hold. The same section drew that entry on every other form type and drew nothing for it on `simple`, apart from a console warning when the object declared the name.

**Clause-②: yes (widening).** Both packages accept more, and nothing they accepted before is refused now.

- `@object-ui/types`: `ObjectFormSection.fields` is `(string | SpecFormFieldInput | FormField)[]`. The new arm is the form view's `{ field, … }` entry, and it is `@objectstack/spec`'s `FormFieldInput` by reference, not a copy. The form already drew that entry. Before, a TypeScript author could not annotate it, because `FormField` requires `name` and types `field` as an object. The zod mirror is unchanged: a section's `fields` entry is still `z.any()` there.
- `@object-ui/plugin-form`, section drawing: on `simple`, an entry that names itself is drawn as it stands, whatever the field pool holds. Such an entry is an object whose `field` is not a string and whose `name` is a string. This is the existing `isInlineFieldDef` predicate that the submit-target rule already reads. It does not require `type`: the spec's inline arm makes `type` optional, and the other five forms draw a typeless entry as the default input.
- `@object-ui/plugin-form`, inline collector: a `simple` form with no data source and no `submitHandler`, whose sections list only inline entries, is now a self-contained collector, as on the other five forms. It opens on `initialValues` / `initialData`, and its `onSuccess` receives the collected values. Before, that form drew no fields and refused the submit. Its submit carve-out now reads the shared `hasInlineFieldSource`.

**What stays refused or warned.**

- A field name and a `{ field }` entry still resolve against the pool on `simple`. A name the pool does not hold is still dropped, and still warned about once when the object declares it, because top-level `fields` and `sections` still intersect (objectui#9884).
- An inline entry with no `name` is malformed and is still not drawn on `simple`.
- A form with no data source and no `submitHandler` still refuses its submit with `DataSource is required for form submission (inline mode not configured)` unless every section entry is inline. One name or `{ field }` entry among inline ones is enough to refuse, on all six forms.

**Behaviour change for an existing schema.** On `simple`, an inline entry whose name the object declares but top-level `fields` leaves out used to be dropped with the intersection warning. It is now drawn as its own definition, with no warning, as on the other five forms. With a data source, its value is still written only if the object declares the field. As on every form, a key the object does not declare is stripped from the write.
