---
'@object-ui/app-shell': patch
---

The flow designer no longer calls a live time-relative sweep "not in effect" (objectui#12672).

A time-relative flow's start node declares its sweep with a `config.timeRelative` descriptor and no `config.triggerType`, which is how the showcase's Task Due Reminder and the docs author it. `@objectstack/spec`'s `resolveFlowTriggerKind` reads the descriptor's presence, and the engine binds the flow as a time-relative sweep. The start node's inspector gated the sweep fields on the `triggerType` select alone. It drew the Trigger select as `—`, and it flagged every stored sweep field (Sweep object, Date field, Offset days, Extra filter) with "Kept, not in effect — its controlling field is off".

- **The sweep fields and the cron field follow the trigger the spec resolves.** A sweep field is in effect whenever the flow resolves to a time-relative sweep. The Cron schedule field is in effect whenever the flow resolves to a schedule or a sweep, so a `type: 'schedule'` flow whose start node carries `config.schedule` and no `triggerType` no longer flags its cron. Choosing an option in the Trigger select still offers these fields before the descriptor exists. A stored value is flagged only when the spec binds the flow as another kind. For example, a `record-*` trigger outranks a leftover `timeRelative` block.
- **The Entry condition follows the resolved trigger too.** The engine evaluates a start node's `condition` for every trigger type, so a stored condition on a sweep, schedule or API start node that stores no `triggerType` is no longer flagged.
- **The Trigger select reads the resolved trigger when the node stores none.** It shows the option in the muted placeholder style, so it does not read as a stored selection. Opening the node writes nothing, and the stored flow stays as it was authored. Choosing an option writes it, as before. A node that stores a `triggerType` shows the stored value, as before.
- **Only the start node the spec reads gets the resolved trigger.** The resolver and the engine read the first top-level start node. A second start node no longer borrows that node's trigger: its Trigger select, its sweep and cron fields, and the API trigger's Secret field ignore it.

Nothing on the package entry changes: no export, prop or type.
