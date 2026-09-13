---
'@object-ui/app-shell': patch
---

The flow `end` node's Outcome control becomes a select over the two outcomes the spec
accepts, and stops advertising two it refuses (objectui#9278).

`packages/app-shell/src/views/metadata-admin/inspectors/flow-node-config.ts` declared the
`end` group's `outcome` key as a free-text box with `placeholder: 'success · failure'`.
`EndConfigSchema.outcome` is a closed enum of `completed | refused` defaulting to
`completed`, and `FlowNodeSchema` discriminates an `end` node's config through it — so
both printed words are refused at parse, not ignored at run time. Measured against the
installed `@objectstack/spec` (17.4.0), with the accepted row in the same output so the
refusals are a reading rather than a dead probe:

```
FlowNodeSchema config.outcome = "success"   => REJECTED: Invalid option: expected one of "completed"|"refused"
FlowNodeSchema config.outcome = "failure"   => REJECTED: Invalid option: expected one of "completed"|"refused"
FlowNodeSchema config.outcome = "completed" => ACCEPTED
EndConfigSchema.safeParse({})               => {"outcome":"completed"}
```

The placeholder was not a neutral hint. On a key with no dropdown it was the only
vocabulary the form offered, so the author's most likely action was to type one of the two
words printed in the box — and the flow then failed to load. This is Commandment #0 one
level down: the **values** are part of the contract too.

The control is now a `select` whose options are exactly the spec's enum, declaring
`defaultValue: 'completed'` so an unset key states on the trigger what the runtime applies
to it, and the invented placeholder is gone. Both are derived from the installed spec, as
`FlowConfigField.defaultValue`'s doc comment requires of a declaration outside the
escalation ledger, and both are reconciled against `EndConfigSchema` in
`FlowNodeInspector.declaredDefault.test.tsx` — through zod's public `toJSONSchema` rather
than a respelled literal, so the claim cannot quietly rot at the next spec bump. The zh-CN
overlay gains the two option labels and the help line.

`refused` carries a cross-field rule the same parse publishes and this form has no typed
control for: it requires a `message` saying why, as a `{token}` template, and `completed`
refuses one. That is named in the field's help rather than left for the author to discover
by a failed load; the key itself stays authorable through the Advanced block, which is
reachable even when a node carries no extra keys. Filed separately rather than fixed here.

`patch`, not `minor`, and not breaking — measured on three axes. The published type
surface is unchanged: `flow-node-config` is not exported from `packages/app-shell`'s entry,
so the emitted `dist/index.d.ts` is untouched. No authored document changes meaning: no
metadata key is added or removed, and a stored value outside the new options still renders,
flagged deprecated, by the branch `FlowNodeConfigField` already had. The one capability
removed is typing an arbitrary string into this field — and every string that removes was
already refused by the loader, so nothing that worked stops working. The same reasoning
scored objectui#6830's select half on this file a `patch`.
