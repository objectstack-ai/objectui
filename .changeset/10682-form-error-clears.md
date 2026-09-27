---
'@object-ui/plugin-form': patch
---

fix(plugin-form): a failed read no longer keeps a record form on its error screen after a later read of the same kind succeeds (objectui#10682)

Every layout `ObjectForm` routes to (its default layout, `DrawerForm`,
`ModalForm`, `SplitForm`, `TabbedForm` and `WizardForm`) reads the object
schema and then the record before it draws, and shows its error screen ahead of
the form whenever a load error is set. Both reads wrote that one error and
nothing ever cleared it. After one failed read, a later read that succeeded
still wrote its values, but the form stayed on the error screen until it
remounted. Since objectui#10572 the default layout also re-reads its record on
every data-invalidation event, so one failed background re-read was enough.

Each form now keeps the failure of each read apart and shows the error screen
while either is set. A read's failure is cleared when a later run of the same
read commits. A record read that succeeds clears an earlier record failure and
never a schema failure: after a failed schema read, a record read can only run
over a schema read earlier, for another object or data source. This is the rule
objectui#10578 set for `ObjectGantt`, applied per read. Only the current run of each read writes its failure, so a superseded
read can neither clear the current failure nor raise its own over the current
values. The error is not cleared when a read starts; it stays until that read
commits.

A failed background re-read is still reported: no form has a silent mode, so it
shows the error screen rather than keeping the last good values, and the next
re-read that succeeds takes the screen back.
