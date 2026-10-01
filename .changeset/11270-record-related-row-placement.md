---
'@object-ui/app-shell': minor
'@object-ui/plugin-detail': minor
'@object-ui/react': patch
---

A related list inside a record now places its child object's `record_related` actions on each row (objectui#11270; the renderer half of the enforce answer on objectstack-ai/objectstack#20937).

The spec declares the action location `record_related` ("actions on a related list section inside a record"), and nothing in objectui read it, so an action placed only there rendered nowhere. Triage read the location as row placement, scoped to a parent record: `list_item` shows on the child's rows wherever the child is listed, and `record_related` shows on them only in a related list inside a parent record.

- **The host bridge** (`RelatedRecordActionsBridge`, `@object-ui/app-shell`) puts the child object's `record_related` actions in each row's action menu beside its `list_item` actions, in the child's declared order, when a parent record is in scope. An action that declares both renders once. The child object's own list view still reads `list_item` only, so a `record_related`-only action does not appear there.
- **The authored `actions` channel** on `record:related_list` (`@object-ui/plugin-detail`) accepts an id whose action declares `record_related` and places it in each row's menu. The refusal notice for an id that cannot be placed now names the three related-list locations: `list_toolbar`, `list_item` and `record_related`.
- **The action designer's preview** (`@object-ui/app-shell`) draws a `record_related` action on the rows of a list, with the frame `list_item` uses. It used to draw it as a button in a section header, which is not where the console places it. `record_section` keeps its section-header frame.
- `@object-ui/react`: the `RelatedRecordHandlers.rowActions` doc comment names both row locations. No code change.

⚠️ Behaviour change: a child action that declares `record_related` now shows on its related-list rows inside a record, where it used to show nowhere.
