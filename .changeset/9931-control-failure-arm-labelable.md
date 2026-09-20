---
'@object-ui/app-shell': patch
---

metadata-admin: a `labelling: 'control'` picker keeps a labelable element on its
catalog-FAILURE arm, so the host's `<label for>` no longer dangles (objectui#9931).

`PickerLoadFailure` is a `div[role="status"]`. Four widgets the `WIDGET_LABELLING`
table declares `'control'` — `object-selector`, `field-selector`, `field-ref`,
`view-ref` — rendered it INSTEAD of their picker when the option catalog failed to
load, so the `id` `FieldRow` hands a `'control'` widget landed on no element at all.
The visible label's `for` resolved to nothing and the field had **no accessible
name** — in the CARD layout as well as in a grid cell, which is the worse half: the
label is right there on screen and points at nothing.

Each of the four now renders the banner BESIDE a freeform text entry that carries the
host's naming and lets the author keep working while the catalog is unknown — the
shape `ref:object` already used on this same arm, and the one `PickerLoadFailure`'s
own contract states for every picker ("keeps whatever control lets the author see and
edit the value already stored, because a failed catalog must not also block
authoring"). For `object-selector` / `field-selector` the entry commits on Enter or
blur and writes the same value shape the picker writes, beside the selected chips —
the `string-tags` shape. ⛔ The picker itself is still **not** rendered on this arm: a
dead, option-less dropdown beside a banner saying the options are unknown is the
conflation objectui#5170 / objectui#5227 exist to end.

`ref:object` and `filter-builder` — the other two `'control'` widgets with a failure
arm — already kept a named control on it and are unchanged.

The `'control'` half of the `WIDGET_LABELLING` docblock now names the failure branch
in its list of examples. That is a record of the reading, not a change of scope: the
rule was always "in EVERY branch it can render", and no widget's declaration moved.
