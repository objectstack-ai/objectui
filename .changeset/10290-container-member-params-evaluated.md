---
'@object-ui/components': patch
'@object-ui/react': patch
---

fix(components): an action container's members evaluate `properties.params` the way a top-level `action:button` does

A member of `action:bar`, `action:group` or `action:menu` never passes through
`SchemaRenderer`, so the evaluation that resolves `"recordId": "${record.id}"`
in a node's `properties.params` did not run for it. On a record page an
`action:bar` member drawn inline handed its `navigate_edit` handler the raw
`${record.id}` text, and a member that the bar placed in its overflow menu, or
an `action:group` / `action:menu` item, did not forward its `properties.params`
at all.

Each container now evaluates its members' `properties` with the evaluator and
scope `SchemaRenderer` uses: `action:bar` where it composes an inline member,
and `action:group` / `action:menu` when they run an item. A container member's
static values therefore reach the handler exactly as a top-level
`action:button`'s do. An item that carries an `ActionParam[]` input list
forwards both, as `action:button` does. A node-level `params` object is still
not read as values (objectui#10289).

`@object-ui/react` exports `useConfigBagEvaluator()` for this. It returns the
`SchemaRenderer` memo's own `properties` evaluation (the same per-key rule and
the same `record` / `current_user` / `page` scope) for a node rendered without
`SchemaRenderer`. It is not a second template engine.
