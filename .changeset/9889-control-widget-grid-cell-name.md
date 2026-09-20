---
'@object-ui/app-shell': patch
---

fix(app-shell): a `labelling: 'control'` widget in a grid repeater cell takes the column header's name

A grid/table repeater row has no `<label>` by design: objectui#5063 writes each
column name once in its `<th>` and points every cell at it by IDREF, keeping the
cell id on the control as a plain anchor. The nine metadata-admin widgets
declared `labelling: 'group'` answered that IDREF. The eleven declared
`'control'` read only the id and dropped it — so `ref:object`, `ref:component`,
`object-selector`, `field-selector`, `field-ref`, `view-ref`, `filter-builder`,
`icon`, `color-input`, `string-tags` and `secret` each rendered as an **unnamed
edit box** in every grid row. Measured on a real `SchemaForm` render at
baseline `fc12bc8c6`: `aria-labelledby` and `aria-label` both absent on the
`'control'` cells, while a `'group'` cell in the same row resolved its column
header.

`labelling` is NOT collapsed, and the two values still mean what they meant. It
answers one question — can the host's `<label for>` reach a labelable element?
— and that question decides whether `FieldRow` emits `htmlFor` or publishes its
label's id; collapsing it re-opens the dangling `for` that objectui#3978 and
objectui#4010 closed. What was wrong is a *second* meaning read into it: that
`'control'` also declares which naming channel the widget consumes. `FieldRow`'s
"exactly one of `id` / `ariaLabelledBy`" is a rule about a host **that has a
label**, which `FieldControl`'s builtin branches already state and already act
on by emitting both in a cell. Only the registry widgets were left behind.

Each `'control'` widget now puts both channels on the same labelable element,
through one file-local `controlNaming()` helper, in every arm it can render. The channels cannot compete: `aria-labelledby` wins the
accessible-name computation over a native `<label>`, and a host that has a
label sends the id alone while a cell that sends both has no label. The two
widgets that carried an `aria-label` fallback for a caller with no host label
(`color-input`, `secret`) now suppress it on either channel rather than on the
id alone.

The auxiliary affordances beside that control — a reveal toggle, the hex mirror
next to a colour swatch, a chip's remove button — are explicitly **exempt** and
keep their own names, so a grid row does not become a set of controls that all
announce the column. That exemption is pinned, not just documented.

No shipped metadata declares a `widget: 'grid'` (or `'table'`) repeater today,
so this is a latent surface rather than a live regression — the instrument that
re-derives that is a search of the shipped `*.form.ts` specs, not this
paragraph.
