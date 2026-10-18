---
'@object-ui/app-shell': minor
---

A flow action whose run pauses for input now closes with the action's own `successMessage` (objectui#12234).

An action that launches a flow and declares a `successMessage` showed that message only when the flow ran straight through. When the flow paused on a screen, the action stayed silent at the pause, as it should, and the run's completion then toasted the generic flow-completed sentence (for example 「流程「升级工单」已完成」), so the action's own message was never shown.

The completion toast now reads, in order: the invoking action's `successMessage`, the flow's own `successMessage`, then the flow-completed sentence. The action's message arrives already localized by the surface that dispatched it, the same copy the straight-through run shows. Both console launch hosts hand it over: the list and page runtime, and the record page. Unchanged: the pause shows no toast, an intermediate step still toasts its next-step notice, and a refused or failed run shows no success toast.

Additive public type change: the `ScreenFlowState` type exported from the package entry gains one optional member, `actionSuccessMessage`, which carries that message from the launching host to `FlowRunner`. Existing values of the type stay valid, and `FlowRunner`'s props are unchanged.
