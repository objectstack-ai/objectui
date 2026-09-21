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

`ObjectForm`, `ModalForm` and `DrawerForm` mount that scope around their form body and, while
an upload is in flight: refuse the submit (which is also the keyboard-submit guard), label
Save "Uploading…", and render the reason as a sentence — `form.uploadInFlight`, new in all
ten locale packs. `ModalForm` and `DrawerForm` own their footer Save and disable it too; the
`ObjectForm` flat/sections paths submit through the `form` node renderer in
`@object-ui/components`, which exposes no per-button disable, so there the refusal plus the
label and the notice are what the user meets.

The other submit owners in this package — `WizardForm`, `SplitForm`, `TabbedForm`,
`EmbeddableForm`, `MasterDetailForm` — are NOT wired by this change and keep the old
behaviour.
