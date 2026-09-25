---
'@object-ui/plugin-form': patch
---

Every `object-form` layout now locks a managed object's fields, as the simple form does (objectui#10612).

**Clause-②: no.** No exported symbol, type or prop changes. The shared step lives in `fieldWriteGate.ts`, an internal module that `index.tsx` does not re-export. What changes is which inputs the `drawer`, `modal`, `tabbed`, `split` and `wizard` layouts draw enabled.

**Before.** ADR-0092 D4 locks a form on a managed object: when the object's CRUD affordance for the form's mode is closed, every field is disabled. The affordance comes from the object's `managedBy` bucket, its `userActions` opt-in (`create` on a create form, `edit` on an edit form) and the server's effective API operations. Only the simple form applied this lock, inside its own field generator. The `drawer`, `modal`, `tabbed`, `split` and `wizard` layouts drew live inputs on, for example, a `managedBy: 'better-auth'` object with no `userActions.create`, and the server then refused the save. The layouts disagreed with each other on the same object for the same user.

**What changed, in observable terms.**

- The `drawer`, `modal`, `tabbed`, `split` and `wizard` layouts, flat or sectioned, now disable every field of an object whose affordance for the form's mode is closed. This covers a managed bucket that does not open the mode, and any object whose `create` or `update` the server's effective API operations deny. The simple form did this already.
- The lock and field-level security now run as one step that every layout calls on the fields it has resolved. A field the caller may not read is dropped, and a field they may read but not edit is locked, on every layout, as before.
- ⚠️ On the simple form, an inline `customFields` member, and a section entry already written as a full field definition, are now locked with the rest of a managed object's fields. The lock used to be set only on the fields the simple form generated from the object, so those two escaped it.
- The lock sets `disabled` only, as it did on the simple form. No message is added, and the submit button stays on screen on every layout. The server's write guard is still what refuses the write.
