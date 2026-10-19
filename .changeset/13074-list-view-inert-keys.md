---
'@object-ui/plugin-list': minor
---

A page `list-view` node now honours two keys of the spec's list view row, and the registration publishes both (objectui#13074):

- `requiredPermissions`: the capabilities a viewer must all hold. A viewer missing one sees an insufficient-permissions notice in place of the list, the same notice the record blocks draw, and no records are queried. A provider that reports no capabilities still shows the list.
- `addRecord`: `enabled: true` draws the Add button, and on a page it now opens the object's create form, the one the object list opens, through the page's existing create path. A viewer who may not create records of the object, or a page with no host to open the form, gets no Add button instead of one that does nothing. `mode` and `formView` are not read.

`sharing` stays unpublished: its Share button has no action the spec declares.
