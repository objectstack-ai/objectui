---
'@object-ui/components': patch
'@object-ui/react': minor
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
static values therefore reach the handler as a top-level `action:button`'s do,
with one difference: the development-build unevaluated-expression diagnostic
runs in the `SchemaRenderer` memo, so it does not report an unresolvable
template on a container member. An item that carries an `ActionParam[]` input
list forwards both, as `action:button` does. A node-level `params` object is
still not read as values (objectui#10289). The one exception is unchanged from
objectui#10462: an `action:group` / `action:menu` item of `type: 'api'` still
forwards it as the request payload (objectstack#5777 window), unless the item
also carries a `properties.params` bag, which now takes precedence.

`@object-ui/react` exports `useConfigBagEvaluator()` for this. It returns a
function that applies the `SchemaRenderer` memo's `properties` evaluation (the
same per-key rule and the same `record` / `current_user` / `page` scope) to a
config bag rendered without `SchemaRenderer`. It is not a second template
engine. Its plain half, `evaluateConfigBagInScope()`, is exported beside
`SchemaRenderer`. Both are built from the module-scope scope builder and
per-key rule that the memo itself calls.

Declared as a minor (Clause-②, widening): `@object-ui/react` gains two public
exports, `useConfigBagEvaluator` and `evaluateConfigBagInScope`. Nothing is
removed or renamed.
