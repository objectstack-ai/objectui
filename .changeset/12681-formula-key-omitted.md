---
'@object-ui/app-shell': patch
---

Editing a formula field no longer shows a false "retired `formula` key" error (objectui#12681).

In the object designer, every edit in a formula field's **Formula (CEL)** editor used to bring up the red spec banner. The banner said "Unrecognized key(s) on this field: `formula`", followed by the pointer that the field "carries the retired `formula` key" and needs one edit in that editor. This happened even on a field that stores only `expression`, while the author was making exactly that edit. The banner cleared a few seconds later, after the autosave, and the saved body was always correct.

The cause was the editor's migration of the legacy alias. It patched `formula: undefined` onto the field, which left a `formula` key on the draft with no value. The live check judges the draft with the spec's strict field schema, and that schema reports any key it does not declare, whatever the value. The editor now writes the field's next definition with the `formula` key left out.

The legacy migration is unchanged. A stored field that does carry `formula` still seeds the editor and still shows the pointer, and the first edit commits `expression` and removes `formula`.

Nothing on the package entry changes: no export, prop or type.
