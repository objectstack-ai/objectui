---
'@object-ui/app-shell': patch
---

The create form uses the object's `create` form view when it declares one (objectui#13099, ruling B′ on objectstack-ai/objectstack#24692).

An object whose view container authors `formViews.create` beside its default `form` (the create-vs-edit model in the objectstack docs) now opens that `create` form view for a create: the console's "New" modal and an action-opened create modal render its sections, layout and size. An edit still uses the default form view (`form`, else the legacy `formViews.default`), and an object with no `create` form view creates with that default, as before. No other named form view is ever picked for a create.

The `create` form view is matched by the name it is served under, `OBJECT.create`. The full-page create route (`editMode: 'page'`) is unchanged here and still renders the default form view.

Nothing is added to the package entry: no export, prop or key moves.
