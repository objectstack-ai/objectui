---
'@object-ui/app-shell': patch
---

feat(app-shell): the flow designer shows a connector action's description and offers its output references

A `connector_action` node's action picker now shows each action's `description`
beside its label, the way the runtime connector registry
(`GET /api/v1/automation/connectors`) has always served it; an action that
authors no description shows its label alone.

Nodes and edges downstream of a `connector_action` node now offer that node's
output in the variable picker: one `nodeId.key` reference for each top-level
`properties` key of the chosen action's `outputSchema`, which is how the engine
stores the action's result. The node and edge inspectors hand the registry
they read to the scope, so the "not in scope" note stops flagging those
references. An action with no `outputSchema`, or one whose schema has no
top-level `properties` object, offers no references: keys are never guessed.
