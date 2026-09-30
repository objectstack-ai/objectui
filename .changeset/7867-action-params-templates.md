---
'@object-ui/react': minor
---

feat(react): an action's `params` values are templates, evaluated where `properties` are

Every string leaf of a node's `params` bag - the node-level `params` and
`properties.params` alike (and the legacy `props.params`, which follows its
canonical bag), at any depth, inside nested objects and arrays - is now
template-evaluated by `SchemaRenderer`, with the same evaluator and the same
scope that already evaluates `properties`. A metadata-authored button on a
record page can therefore name the record it sits on:

```json
{ "type": "action:button", "label": "Edit", "actionType": "navigate_edit",
  "params": { "objectName": "account", "recordId": "${record.id}" } }
```

Before this, both spellings of `params.recordId` reached the action handler as
the raw `${record.id}` text: the node-level bag was never evaluated, and
`properties.params` was one value of a shallow loop, so the template inside it
was never visited.

Behaviour change, stated plainly: a `params` string containing `${...}` is now
evaluated at render time instead of being passed through verbatim. It reaches
only values whose templates never worked - no authored `params` bag in this
repository carries one. A template that still cannot be evaluated (an unbound
root such as `${nope.id}`) keeps its source text exactly as before, and the
development-build unevaluated-expression diagnostic now reports it by its path
(`params.recordId`, `properties.params.target.id`), so a wrong template stays
loud.

What is not walked: an ARRAY `params` (the `ActionParam[]` definition list the
params dialog renders) is left as authored; keys are never evaluated, only
values; non-plain objects (`Date`, `Map`, class instances) and functions pass
through by identity; a cycle in a host-built bag ends the walk. Every other
nested config value keeps the shallow reading it had.
