---
'@object-ui/plugin-form': patch
---

A record's Edit form saves the owner the user changes or clears (objectui#12205). The form dropped `owner_id` from every save, so a reassignment or a clear made in the Edit dialog never reached the server: Save answered as if it had saved, the dialog closed, and the record kept its old owner. When the owner was the only change, the update carried every other field unchanged and no owner.

An edit now sends `owner_id` when, and only when, its value differs from the record the form loaded: a new owner is sent as its id, and a cleared owner as `null`. This applies to the modal, drawer and page Edit forms, and to the tabbed, split and wizard layouts. The server stays the authority: a role without the transfer grant is refused, and the form shows that refusal as its error and stays open.

Unchanged:

- An owner the user did not touch is still never sent, so a save from a role without the transfer grant is not refused for echoing it back (objectui#10108). This holds for a save with nothing changed, and for any save where the form has no loaded record to compare against.
- A create never sends the owner.
- The caller's field-level security, and an object that declares its owner read-only, still keep the owner off the wire.
- The business-unit and tenant columns (`owning_business_unit_id`, `organization_id`, `tenant_id`) and the audit columns are still never sent, even when they differ.
- A form laid out automatically still renders no owner input.
- The master-detail form's batch still sends no owner, for the header record as well as its lines. An owner changed in a master-detail header is therefore still not saved.

Nothing is added to the package entry: no export, prop or type changes.

Clause-②: no
