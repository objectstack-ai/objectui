---
'@object-ui/plugin-form': patch
---

A create form preselects the option a field's option list marks `default: true` (objectui#11914).

A `select` field that declares no `defaultValue` but marks one option `default: true` opened on the "Select an option" placeholder in every object-form container, the console's create dialog included. The server stores the marked option when a create omits the field, so the objectstack tutorial's Create Ticket form showed Priority and Status empty and could not be submitted until the user picked the values the metadata had already chosen.

The create form now reads the option list the way the server's insert path does:

- only when the field declares no `defaultValue`. A field-level default, static or runtime, always wins, and the option flag is then not seeded;
- a single-valued field takes the first marked option;
- a multi-valued field (`multiselect`, or `select` with `multiple: true`) takes every marked option, as an array.

A value the caller seeds or the user picks still wins. Edit forms are unchanged: they show the stored record.

Nothing is added to the package entry: no export, prop or type member.
