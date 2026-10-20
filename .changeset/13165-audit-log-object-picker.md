---
'@object-ui/console': patch
---

The Audit Log's Object filter is picked from the served objects instead of typed (objectui#13165).

The filter was a free-text box under the placeholder "e.g. account", sent as an exact match on the stored object name. In an app whose objects carry a prefix the placeholder's own example matched nothing (`account` listed no row while `crm_account` held them), and finding any object meant knowing its API name.

It is now a searchable picker of the objects the console's metadata serves, each shown as `Label (name)`, the spelling the object-ref picker uses. It sends the chosen object's API name, as the Actor filter sends the chosen user's id. "Any object" is the unfiltered state; choosing the chosen object again, or "Clear filters", removes the filter. The query is unchanged: still an exact `object_name` match. The visible "Object" label now names the control for assistive technology.

An object the metadata no longer serves (a deleted one, say) is not offered, so this filter cannot narrow the ledger to its old rows.
