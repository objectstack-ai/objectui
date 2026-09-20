---
'@object-ui/core': minor
'@object-ui/fields': minor
---

A picklist option with a blank label now renders its `value` instead of a blank row (objectui#9230).

Adding a picklist option in App Builder and filling only the value box publishes
`{ "value": "low", "label": "" }`, and the record form's select then offered three
unclickable blank rows with nothing anywhere explaining why.

**The producer was not the bug.** An empty label is a document the contract accepts —
measured on `@objectstack/spec` 17.4.0, `SelectOptionSchema` accepts
`{ value: 'low', label: '' }` and refuses `{ value: 'low' }` at `[label]` — so `''` is
the only legal thing the designer can write for a cleared Label box, and it writes it
deliberately (objectui#7014 Q2, pinned). What the contract does not state is what a
renderer should DISPLAY for a legal-but-blank label, and objectui had already answered
that on half its read sites: all four option widgets fell back to the value on their
read-only path (`opt?.label || v`) and rendered `{opt.label}` raw on their interactive
path. The same option read `low` in a read-only form and blank in an editable one.

`optionDisplayLabel` in `@object-ui/core` is now that decision written once —
label, or the value when the label is blank or whitespace-only — and all eight read
sites across `SelectField`, `MultiSelectField`, `RadioField` and `CheckboxesField` call
it, so the two halves cannot drift apart again. Radio and checkbox rows gain real
`<label for>` text with it, which is hit area and an accessible name, not just glyphs.

Minor rather than patch on the stored-data test: every option already published with an
empty label renders differently after this change, without the document moving. It also
adds one public export to `@object-ui/core`.

This is display only. Nothing is rewritten, no metadata is migrated, and whether the
contract should refuse blank labels outright stays a `packages/spec` question.
