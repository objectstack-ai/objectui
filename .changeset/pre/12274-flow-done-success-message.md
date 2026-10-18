---
'@object-ui/app-shell': patch
---

A flow action whose flow runs straight through, with no screen, now closes with the flow's own `successMessage` when the action declares none (objectui#12274).

A flow can declare a `successMessage`, and the server carries it on every terminal run, not only on runs that paused for input. The console read it only when the run paused on a screen: there the completion toast reads the action's `successMessage`, then the flow's, then the flow-completed sentence. A run that went straight through toasted the action's `successMessage` or the generic "Action completed successfully", and the flow's message was dropped.

Both paths now follow one precedence: the action's `successMessage`, then the flow's own `successMessage`. When the action declares a message, the straight-through toast is unchanged. When only the flow declares one, that message is shown once, in place of the generic text. When neither does, each path keeps its own default text. A refused or failed run still shows no success toast. Both console launch hosts follow it, the list and page runtime and the record page, on both doors a flow click can take.

No exported type or prop changes.
