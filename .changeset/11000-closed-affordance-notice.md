---
'@object-ui/plugin-form': patch
'@object-ui/i18n': patch
---

A record form whose fields are all locked because the user may not create (or
edit) records of its object now says so (objectui#11000). The ADR-0092 D4 lock
disables every field when the object's affordance for the form's mode is
closed: the object's `managedBy` bucket keeps it closed, or the server's
effective API operation set for the user lacks `create` (or `update` on an edit
form). Until now nothing on the form said why, and a wizard's Next stayed
enabled.

- Every form layout that draws the lock (the default form, `drawer`, `modal`,
  `tabbed`, `split` and `wizard`) renders one notice above the fields, such as
  "You don't have permission to create Project records. The fields are
  read-only." It names the object by its label, translated when the app's
  locale bundle translates it, and names `create` on a create form or `edit` on
  an edit form. It is announced as a status (`role="status"`).
- The notice reads the same verdict the lock does, so it appears exactly when
  every field is locked for that reason. A field locked on its own (one the
  user may read but not edit, or one declared `readonly`) shows no notice.
- A wizard does not walk a user who cannot submit through its steps: while the
  lock holds, Next and the final submit button are disabled, and the step
  indicator does not jump forward even with `allowSkip`. Cancel and Back stay
  usable, and every step is still shown. A user whose affordance is open sees
  no change.
- Two keys are new in the `form` namespace of all ten packs:
  `noPermissionToCreate` and `noPermissionToEdit`, each with an `{{object}}`
  placeholder.

The lock itself is unchanged, and so is the Save button of the non-wizard
layouts.
