---
'@object-ui/app-shell': minor
---

feat(app-shell): the flow node inspector marks the config keys the installed spec refuses the node
without (objectui#10948).

`@objectstack/spec` 17.5.0 refuses, at authoring, a flow node whose executor could not run it: a key
its config contract requires left out (a CRUD node's `objectName`, an `http` node's `url`, a
`notify` node's `title` while it has no `template`, a `script` node's `function`, a `subflow` or
`map` node's `flowName`, …), a decision branch with no `label` or `expression`, a screen field with
no `name`, and a `connector_action` whose `connectorConfig` names no connector or action. The
designer's live flow check already reports each one at the node's config path; the inspector now
marks the same keys before the author reaches that error, with the metadata form's own required
marker — the `*` in the field label, the row label of a branch or screen-field row, and
`aria-required` on the control where the inspector owns it.

The inspector keeps no list of required keys. Each marker is the installed spec's own verdict, asked
of the node as it stands: the key is removed from a copy of the node and handed to the judges the
flow parse runs (`flowNodeConfigRefusals`, the predicate-slot walk, and `FlowNodeSchema`), so a
requirement that depends on the configuration — `notify`'s `title` without a `template`, a `loop`'s
`collection` once it has a body, a refused `end`'s `message` — is marked only while it applies.
