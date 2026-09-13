---
'@object-ui/app-shell': patch
---

Flow-node inspector: `approval.lockRecord` and `boundary_event.boundaryConfig.interrupting`
now declare the `defaultValue` the installed spec applies, so their checkboxes stop
asserting the opposite of what the runtime does (objectui#9277).

Both keys default to `true` in `@objectstack/spec` (measured on 17.4.0):
`ApprovalNodeConfigSchema` materialises `lockRecord: true` for an approval config that
omits the key, and the `FlowNodeSchema` boundary block materialises
`interrupting: true`. The hand-written descriptor table declared neither. Since
objectui#8451 a boolean config control seeds its checked state from `defaultValue`, so
declaring nothing does not render as "no claim" — it renders as UNCHECKED. An author
opening a node that omits the key read `Lock record` unchecked and believed the record
stayed editable while the request was pending (the runtime locks it), and read
`Interrupting` unchecked and believed the boundary event would leave its host activity
running (it cancels it).

Both values are derived from the installed spec rather than typed from taste, and the
acceptance pin re-derives them from `ApprovalNodeConfigSchema` / `FlowNodeSchema` at
assertion time instead of restating the literal `'true'`, so the next upstream flip
reddens there rather than drifting silently the way objectui#6620 did.

Nothing is written. `defaultValue` is shown, never committed (objectui#6263's standing
ruling), and a stored `false` still beats the declaration on both fields — a
deliberately non-locking approval and a non-interrupting boundary event stay authorable
and keep rendering unchecked.

`patch`, not `minor`: no prop, option or metadata key is added, and no authored document
changes meaning. What changes is that two controls stop contradicting what the runtime
already does with metadata that already parses.
