---
'@object-ui/components': minor
'@object-ui/i18n': minor
---

A create form says when the server will fill a field: "Set automatically when saved." under a field whose `defaultValue` the server resolves at insert, while the field is empty (objectui#12108).

A `defaultValue` that is a CEL expression (`{ dialect: 'cel', source: 'today()' }`) or a runtime token (`NOW()`, `current_user`) is an instruction, not a value. The client cannot evaluate it, so a create form leaves the field empty and leaves it out of the submit, and the server fills it at insert. Until now the field opened empty, or on "Select an option", with nothing saying a value was coming.

- **Where it shows.** In the field's description slot, after any `description` the field declares, in every object-form layout (`ObjectForm`, `ModalForm`, `DrawerForm`, `TabbedForm`, `SplitForm`, `WizardForm`), under any field widget: the form draws it, not the widget. The control's `aria-describedby` already names that element, so a screen reader reads the hint with the field.
- **When it shows.** Exactly while the submit would leave the key out: the field is server-owned (`isServerOwnedValue`, the classifier that already lowers `required` on such a field) and its value is empty. A value the user types removes the hint and is saved instead.
- **When it does not.** On an edit form; on a control that takes no input (disabled or read-only), which also keeps it off a `mode: 'view'` form; and on a boolean, which the form starts at `false`, so it is never empty.
- **Required fields.** Measured unchanged: a `required` field with a CEL default does not block Save on a create form, shows no required marker, and is left out of the submit so the server fills it.
- **Locale key.** `form.serverDefaultHint`, in all ten packs. `TranslationKeys` gains it.

**Clause-②: yes (widening)**: one locale key added to `@object-ui/i18n`'s published packs, which widens `TranslationKeys`. No export, prop or schema key is added.
