---
'@object-ui/plugin-form': minor
'@object-ui/fields': minor
'@object-ui/i18n': minor
---

A record form can no longer be saved while an upload is still in flight (objectui#10166).

A `file` / `image` value only becomes its fileId once the presigned upload settles. Until
now a record form had no notion of upload state at all, so a Save pressed during that
window wrote the record WITHOUT the attachment — and reported success. The user picked the
file, saw it listed and saved; there was no error, no warning, and the record looked saved.
Whoever noticed did so later, looking at a record that should have a file and does not.

`onUploadingChange` (ADR-0059) already carried the signal, and had exactly one consumer,
`ActionParamDialog`. It could not have a second: that prop is per-widget, and a record form
hands a `fields` array to the `form` node renderer and never touches a widget, so there is
no point in the chain where it can attach a callback — and its upload controls can sit
inside a section, a tab or a line-items subform.

`@object-ui/fields` therefore publishes the AGGREGATION beside the prop: `useUploadingScope`
(the host's "is anything below me uploading") and `UploadingScopeProvider`.
`useUploadingSignal` — also exported now, for widgets authored outside this repo — feeds
both sinks from the one call it already made, so the per-widget prop and the scope cannot
disagree, and a host that mounts no provider is unaffected. A widget that unmounts
mid-upload releases its slot, so a collapsing section cannot wedge Save shut.

Nesting CHAINS rather than shadows: an inner scope gates its own Save AND reports itself to
the scope above. The direction is forced by `MasterDetailForm`, whose Save persists parent
and children in one batch while its rows are edited by nested `ObjectForm`s — a gate that
saw only the parent's uploads would refuse nothing while a child's attachment was in flight
and would still read as coverage.

Every submit owner in `@object-ui/plugin-form` is gated: `ObjectForm`, `ModalForm`,
`DrawerForm`, `SplitForm`, `TabbedForm`, `WizardForm`, `MasterDetailForm`, and
`EmbeddableForm` through the `ObjectForm` it hosts. While an upload is in flight each
refuses the submit (which is also the keyboard-submit guard), labels Save "Uploading…", and
renders the reason as a sentence — `form.uploadInFlight`, new in all ten locale packs. The
hosts that own their Save button — `ModalForm`, `DrawerForm`, `MasterDetailForm`, and
`WizardForm`'s final step — disable it as well; the flat `ObjectForm`, `SplitForm` and
`TabbedForm` paths submit through the `form` node renderer in `@object-ui/components`, which
exposes no per-button disable, so there the refusal plus the label and the notice are what
the user meets.

`WizardForm` is gated on its FINAL commit only. Moving between steps writes nothing, so
`Next` is deliberately untouched.
