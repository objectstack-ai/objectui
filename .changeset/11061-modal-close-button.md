---
'@object-ui/components': minor
'@object-ui/plugin-form': patch
---

fix(plugin-form): `object-form`'s `modalCloseButton: false` hides the modal's close button

An author can now hide the close (X) button of a modal form. `modalCloseButton`
was declared on `ObjectFormSchema` and on the `object-form` registration, and
`ObjectForm`'s modal route forwarded it, but `ModalForm` never read it: `false`
still drew the X, with no effect and no error. `ModalForm` now honours it on both
of its dialog arms (the flat form and the `subforms` master-detail form). Only an
explicit `false` hides the button; unset and `true` keep it. With the X hidden the
modal still closes on Escape, and on the Cancel action when that is shown.

`@object-ui/components`: `MobileDialogContent` gains an optional `showCloseButton`
prop, default `true`, named after upstream Shadcn's `DialogContent` prop of the
same purpose. `false` leaves the close button out of the DOM. Existing callers are
unchanged. The component's exported props type gains this one optional member,
which is why this package takes a minor bump.
