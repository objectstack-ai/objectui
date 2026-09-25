---
'@object-ui/plugin-form': patch
---

fix(plugin-form): `customFields` members render inside explicit `sections` on the drawer, modal, tabbed, wizard and split arms

The registered description of `object-form.customFields` is one sentence for
every `formType`: "Field definitions merged over the set generated from object
metadata." With explicit `sections`, an `object-form` with `formType: 'drawer'`,
`'modal'`, `'tabbed'`, `'wizard'` or `'split'` (and a `DrawerForm`, `ModalForm`,
`TabbedForm`, `WizardForm` or `SplitForm` mounted directly) built every field a
section names from the object schema alone, so a member naming that field was
dropped: its label, its `required` and the rest of its definition never reached
the form. The default arm already drew the member.

Those five arms now take a section field's definition from the member naming
it, through the same lookup the default arm's merge uses; a field no member
names is built from the object schema as before. This holds for a bare field
name and for a spec `{ field }` entry, whose own overrides still apply on top
of the member. Over a member, the widget changes only when the entry restates
`type`. A section naming a field that only a member supplies now renders that
member, where it used to render a plain text input labelled with the field
name. A member that no section lists is still not drawn when `sections` are
given, as on the default arm. `TabbedFormSchema`, `WizardFormSchema` and
`SplitFormSchema` now declare `customFields`, as `DrawerFormSchema` and
`ModalFormSchema` already did.

Unchanged: the rules for what a section entry may override, which still differ
between the default arm and the other five.
