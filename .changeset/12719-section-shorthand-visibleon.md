---
'@object-ui/plugin-form': minor
---

A section entry written as a bare field name no longer reads the object field's `visibleOn` when sections are normalized (`normalizeSectionField`, used by `ObjectForm`, `ModalForm` and the record form page) (objectui#12719). The spec's object `FieldSchema` declares no `visibleOn`: an object field's visibility predicate is `visibleWhen`, which the shorthand already carries onto the runtime field as its field-level rule.

Clause-②: no (narrowing). The shorthand stops honouring an object field's `visibleOn` (it was copied into the runtime field's view-level `visibleOn` slot), and starts reading nothing new.

What a raw schema loses: an object schema handed straight to the form, whose field carries `visibleOn: 'PREDICATE'`, no longer hides that field where a section lists it by name; write `visibleWhen` on the object field. What is unaffected: object schemas served by an ObjectStack runtime, which the spec's strict `FieldSchema` parse never lets carry `visibleOn`; a form view field's `visibleWhen`; and a runtime `FormField`'s own `visibleOn` slot.
