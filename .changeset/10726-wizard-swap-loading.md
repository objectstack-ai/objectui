---
'@object-ui/plugin-form': patch
---

fix(plugin-form): a wizard goes back to its loading state when it is pointed at another record (objectui#10726)

When a mounted `WizardForm` in edit mode was given another `recordId`, it kept
drawing the previous record while the new record was read. The previous
record's values stayed on the current step and could be edited, so anything
typed in that window was typed into the previous record's values while the form
already stood for the new record.

The wizard now does what `DrawerForm`, `ModalForm`, `SplitForm` and
`TabbedForm` already do: a change of record takes it back to the loading state
until the new record's answer lands. Only a change of record does this. A
wizard whose record read runs again for the same record, for example because
the caller rebuilt `initialValues`, stays on screen. A create wizard never goes
back to loading.

The current step, the completed-step marks and the step error marks carry over
a record change, as before. No step draws a value of the previous record once
the new record lands, since every step reads its values from the new record's
answer. No prop, export or schema key changes.
