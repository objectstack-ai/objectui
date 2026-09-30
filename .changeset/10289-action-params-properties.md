---
'@object-ui/components': minor
'@object-ui/app-shell': minor
---

feat(components)!: an action node's static values ride `properties.params`; `params` is only the input list

**Breaking (objectui#10289, ruling A).** An action's `params` has one meaning:
the `ActionParam[]` list of inputs to collect from the user before the action
runs. That is how `UIActionSchema.params` and `@objectstack/spec` 17.4.0's
`ActionSchema.params` declare it. The SDUI node envelope declares no
node-level `params` key. `action:button` and `action:icon` now read a node's
static execution values from `properties.params` only. They forward those
values to the action runner as `params`, where handlers such as
`navigate_create` / `navigate_edit` read `objectName` / `recordId`.

- A node-level `params` **object** is no longer read as values. It is
  ignored, and a development build logs one warning per action that names
  `properties.params`.
- A node-level `params` **array** (`ActionParam[]`) still works: it is
  forwarded as `actionParams` and opens the params dialog. `action:icon` now
  routes it the same way `action:button` does.
- Both channels can appear on one node: an `action:bar` member can carry
  inputs in `params` and values in `properties.params`. Under `SchemaRenderer`,
  the `properties` hoist copies `properties.params` over a node-level `params`.

**Migration.** Move the object unchanged from node-level `params` to
`properties.params`:

```json
{ "type": "action:button", "label": "Edit", "actionType": "navigate_edit",
  "properties": { "params": { "objectName": "account", "recordId": "${record.id}" } } }
```

Templates in `properties.params` are evaluated as before (objectui#10282), so
`${record.id}` still resolves on a record page. A `type: "api"` request payload
belongs in `bodyExtra`.

**Census, taken before the change.** 13 in-repo sites wrote a node-level
`params` object on an `action:button` / `action:icon` node:

- 4 examples in published docs: the record-edit-modes guide and the
  `@object-ui/app-shell` README, 2 each;
- 2 in the `navigate_*` handler comment in app-shell `AppContent`;
- 7 in tests that authored it as expected behaviour.

12 moved to `properties.params`. The remaining one is a test case that now
pins the object form as not read. No JSON metadata under `examples/` or `apps/`
used the object form, and neither did the published `skills/` tree. Stored
metadata outside this repository was not measured.

Not changed here: the pending objectui#7867 changeset shows a node-level
`params` example. As of this release that form is not read; use
`properties.params`.
