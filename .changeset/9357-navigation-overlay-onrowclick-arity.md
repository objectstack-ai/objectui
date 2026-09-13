---
'@object-ui/react': minor
---

`UseNavigationOverlayOptions.onRowClick` now declares the modifier payload it
has always been called with (objectui#9357).

`useNavigationOverlay`'s `handleClick` invokes the caller-supplied `onRowClick`
with two arguments — the record, and the optional `HandleClickModifiers`
payload (`metaKey` / `ctrlKey` / `button`) a host needs to implement
Cmd/Ctrl/middle-click. The option declared only the record, and `handleClick`
carried a type assertion that widened the value at the call site so the code
would compile. The second argument was therefore invisible on the one line a
host reads, and a host that wanted it had to discover it from the
implementation and then spell its own second parameter optional to stay
assignable.

The declaration now names both parameters and the assertion is gone.

**Not breaking, in either direction.** A one-parameter handler stays assignable
to the widened signature (its extra parameter is optional), and a handler
written against the widened signature was already assignable to the old one —
measured on this change, both directions. No caller has to change; what changes
is that a caller who wants the modifier payload can now see, from the published
type, that it is there.

Scope note: this repairs the hook's own option. The pass-through props on the
view components that feed it — `ObjectKanban`, `ObjectGallery`, the
`plugin-kanban` renderer's `onCardClick`, and the `onRowClick` prop on the other
view plugins — each still declare one parameter on their own published face;
which spelling that family converges on is objectui#9357's open question and is
not decided here.
