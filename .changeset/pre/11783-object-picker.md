---
'@object-ui/app-shell': patch
---

Studio's object-name inputs now share one object picker that offers the objects it already holds, grouped and labelled, and resolves a name only once it is chosen (objectui#11783).

A Lookup field's *Related object* and a summary field's child object, and every flow input that names an object (the trigger's *Object*, a record node's object, a screen's object form, a map node's item object, a time-relative sweep's object), used to save the draft on every keystroke. Each save made Studio look up the typed prefix, so typing `repairs_repair_ticket` into the trigger's *Object* sent about forty `GET /api/v1/meta/object/PREFIX` requests, each answered 404. The suggestions listed every served object by bare name, the platform's internal objects first, and a draft object showed no label.

- **One lookup, for the chosen name.** Typing stays in the input. The name is saved when the author chooses a suggestion, presses Enter or leaves the input, and only that name is looked up. Escape abandons the typing.
- **Any value is still accepted.** Enter and leaving the input keep exactly what was typed, matched or not, so a flow value that is an expression still saves as before, and the server judges an unknown object name as it always did.
- **Grouped and labelled suggestions.** The objects of the package being edited come first, then the other objects, each shown with its label and its name. The platform's own objects, the ones it marks `isSystem`, sit in a collapsed *System* group. A search still reaches them, so a Lookup to `sys_user` stays one search away. A draft object of the package is offered with the label its draft declares and marked as a draft.
- The trigger's *Object* input no longer suggests `crm_lead`, an object most apps do not have.

Nothing is added to the package's entry: no export, prop, type member or language-pack key.
