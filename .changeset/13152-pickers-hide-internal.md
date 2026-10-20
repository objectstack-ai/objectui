---
'@object-ui/app-shell': patch
---

Studio's field pickers no longer offer the columns the platform injects and hides (objectui#13152).

The platform adds bookkeeping columns to an object and marks each one both `system` and `hidden`: the search companion `__search` ("Search Index"), `owning_business_unit_id` and `organization_id`. Studio's Data rail and the list filter already kept them out (objectui#11780, objectui#11810). Two pickers still listed them:

- **The list-view properties panel** (Interfaces, an object's list view). Columns "Add field", the filter, the sort and the kanban card's fields offered "Search Index" and the other hidden platform columns. They no longer do. A field the view already uses stays listed, so a stored filter or sort on one still shows its label instead of a blank field.
- **The flow reference picker's field suggestions**, including the Notify node's "Record field" recipient. The suggestions no longer include those columns. The box still accepts any typed name, and a stored value shows as it was written.

Both pickers use the Data rail's rule: a field is left out only when it carries both marks. An author's own hidden field and a platform field that is not hidden, such as `owner_id`, are still offered.

Nothing is added to the package entry: no export, prop or language-pack key.
