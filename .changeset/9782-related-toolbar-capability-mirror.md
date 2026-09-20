---
'@object-ui/plugin-detail': patch
---

The related list's `list_toolbar` header now mirrors ADR-0066 D4
`requiredPermissions` as a UI hide (objectui#9782).

`@objectstack/spec` declares `requiredPermissions` as "enforced with 403 on the
platform action route (script/flow/modal + MCP) and **mirrored as a UI hide**".
`RelatedList` drew its header buttons from the set
`RelatedRecordActionsBridge.deriveActions` hands it, and that bridge filters on
`locations` alone — so the toolbar evaluated each action's `visible` CEL
predicate and nothing else. An action declaring a capability the caller does not
hold rendered anyway, one surface over from `EnvironmentListToolbar`, which
hides it. This is the third and last carrier of that one declaration, after the
data-table row menu (objectui#9623) and `DeclaredActionsBar` (objectui#9572).

The shared `useCapabilityGate` is now applied **once** to the toolbar set, in
the list's own body. Placement is the point rather than an afterthought: the
hook resolves the held set from the nearest `ActionProvider` above its caller,
and objectui#9572 measured what a gate on the wrong side of that provider does —
it reads a different provider, or none at all, and fails open on every action
forever with a green suite. Unlike `DeclaredActionsBar`, this component mounts
no provider of its own, so the list body and the buttons it draws read the same
one, the provider `RecordDetailView` seeds with the `user.systemPermissions` the
action engine reads. The new suite supplies the held set through that provider
alone, so moving the filter out of the component fails it.

Nothing is enforced in the renderer and no request changes shape: the server
remains the sole authority and still answers 403. Unknown capabilities fail
**open** (an absent `systemPermissions` is not a denial), an empty held set
means "holds nothing" and gates normally, and because the capability gate is
ANDed in front of the existing fail-closed `visible` predicate the composition
is monotone — it can only ever hide more than before, never expose something
that was hidden.
