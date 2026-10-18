---
'@object-ui/app-shell': patch
---

Studio's Data pillar no longer shows the columns the platform adds to an object and hides (objectui#11780).

The records grid, the Form preview and the form designer showed "Search Index" (`__search`) and "Owning Business Unit" (`owning_business_unit_id`) on every object, while the runtime list hides both. The three views now leave out every field the served metadata marks both `system: true` and `hidden: true`, which is how the platform marks the columns it injects for its own use. The tenant column `organization_id` carries the same marks and stays out as before.

- A field you hid yourself (`hidden: true` without `system`) still shows in Studio, so you can open it and un-hide it.
- A system field that is not hidden, such as the reassignable `owner_id`, still shows.
- The audit columns (`created_at`, `updated_by` and the rest) stay out of these views as before.
- The form designer only hides these fields. Moving, reordering or regrouping fields saves them back with their definitions unchanged.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
