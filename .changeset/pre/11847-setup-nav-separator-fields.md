---
'@object-ui/app-shell': patch
---

Setup's app editor no longer offers a Label or an Icon field on a separator entry (objectui#11847).

The spec's separator member declares `type`, `id` and `order` and nothing else, and it is strict. The app editor's nav inspector drew its Label and Icon fields for every entry, so a label typed on a separator (for example showcase's `nav_sep_reports`) wrote `{ type: 'separator', label }`, and the save refused it with `unrecognized_keys [label]`, a field the editor itself had offered. A separator now shows the same note the Studio's nav inspector shows in place of its Label field, and no text field at all. A page, object or any other entry keeps both fields. Opening a separator writes nothing.

Which describing fields an entry is offered is now one rule, read by both nav inspectors: an entry is offered a field exactly when the spec member for its type declares it. The Studio's nav inspector already hid its Label field on a separator, and its behaviour is unchanged.

Nothing is added to the package entry: no export, prop, type member, language-pack key or accepted input.
