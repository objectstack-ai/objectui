---
'@object-ui/types': minor
'@object-ui/components': patch
'@object-ui/plugin-form': patch
'@object-ui/plugin-detail': patch
'@object-ui/console': patch
---

A field group whose `visibleWhen` cannot be evaluated is now hidden, header and members, on the form and on the record detail page (objectui#13055).

`@objectstack/spec` declares `ObjectFieldGroupSchema.visibleWhen` fail-closed: "the whole group (header included) is shown only when TRUE, else hidden (fail-closed)". Until now both surfaces failed open. A group whose predicate had a parse error, named an unknown field or root, or failed to evaluate was drawn in full, with only a console warning.

- **Form.** Every layout now hides the group: simple, tabbed, split, drawer, modal, and the console's form page. This holds whether the group comes from the object's `fieldGroups` fallback or from a `{ group }` section reference. Members of a group hidden this way behave as they do under a FALSE predicate: their values still submit and their client-side validation is skipped.
- **Record detail page.** `record:details` hides the group's section.
- **Diagnostic.** The one-time warning still fires, and now names the default taken: `safe default (false)` and "the group is hidden".
- **What stays fail-open.** An authored form-view section's own `visibleWhen` still faults open, as `FormSectionSchema.visibleWhen` declares. So do a field's own `visibleWhen`, `readonlyWhen` and `requiredWhen` (ADR-0137 D3), and every other predicate slot. A well-formed predicate gates exactly as before.

How the direction reaches the renderer: a form-view section's predicate and a field group's predicate arrive at the form renderer in the same slot, a `section-divider` row's (or a tab's) `visibleWhen`. So the direction travels with the predicate. `@object-ui/types` declares one runtime hand-off key, `visibleWhenFault?: 'hidden' | 'shown'`, on `ObjectFormSection`, `FormField` (`section-divider` rows only) and `FormFieldTab`, and mirrors it on the zod faces. `deriveFieldGroupSections` stamps `'hidden'` beside a group's predicate. Every layout carries it next to `visibleWhen`, and the form renderer reads it as the fault fallback. Absent means today's fail-open. It is not an authoring key: the spec's strict `FormSectionSchema` refuses it in authored metadata.
