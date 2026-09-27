---
'@object-ui/plugin-form': patch
---

fix(plugin-form): a record form keeps what its current read committed when an earlier read lands late (objectui#10712)

Every layout `ObjectForm` routes to (its default layout, `DrawerForm`,
`ModalForm`, `SplitForm`, `TabbedForm` and `WizardForm`) reads the object
schema and then the record before it draws. When the form is pointed at
another record or object while a read is in flight, that earlier read is
superseded, but two of its writes still landed:

- The default layout and `WizardForm` wrote a superseded record read's values
  over the current record's. If the previous record's answer landed last, the
  form showed the previous record's values under the new record id. If it
  landed first, it ended the loading state while the current read was still
  pending. The other four layouts already ignored such an answer.
- All six layouts wrote a superseded object-schema read over the current one.
  After an `objectName` or data-source change, the previous object's schema
  could land last, and the current record was then drawn against the previous
  object's fields. A superseded schema read that failed also ended the loading
  state while the current one was pending, on the four layouts whose failure
  branch ends it.

Now a superseded read commits nothing: not the values, not the schema, and not
the end of the loading state. Each read's failure is still reported only by
its current run, as objectui#10682 set. No prop, export or schema key changes.
