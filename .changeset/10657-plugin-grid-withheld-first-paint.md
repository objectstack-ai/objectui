---
'@object-ui/plugin-grid': minor
---

`object-grid` no longer draws an untyped column as text before its object schema has loaded: the column is WITHHELD until it has, and stays withheld when the read fails; a host can hand the grid the field types it holds (`objectFields`) so there is no such window (objectui#10657, which folded objectui#10706).

On the host-fetched path (rows handed down as `data`, as `ListView` does) the rows paint
before the grid's own `getObjectSchema` read lands. An untyped view column takes its type
from that schema, so until it arrived a column over a `password` / `secret` field drew
the raw value as text and handed it out (copy, tooltip, the grid's client export, the
mobile card), and grouping by it printed the value as the group label. A failed read was
swallowed as non-fatal, leaving the column in the clear for the life of the grid.

- **Withheld.** While an object-bound grid (an object name, and a data source that can
  answer `getObjectSchema`) has no field types in hand, a column with no `type` of its
  own is drawn as the mask (`MaskedCellRenderer` from `@object-ui/fields`), carries
  `TableColumn.masked`, is left out of the grid's client export, is drawn through its cell
  on the mobile card, and cannot be a grouping key (the entry is ignored without a
  warning until the types are known; a masked field is still warned about). No type is
  inferred for it from its name or values meanwhile. It stays withheld when the read
  fails: fail closed, never back to text. A column that authors its own `type` draws
  from it, as it did. A grid with no `getObjectSchema` to wait for is unchanged.
- **The record panel** a row opens under overlay navigation (drawer, modal, split,
  popover) with no declared fields in hand printed every value of the record, inferred
  from its value and name. While the types are unknown it now draws each value as the
  mask as well.
- **New prop `objectFields` on `ObjectGrid` (`ObjectGridComponentProps`).** The object's
  field catalogue, handed down by a host that has already read the definition. The grid
  answers every field-type question from it until its own read lands, so the columns
  draw from their declared types at first paint and nothing is withheld. It is a runtime
  prop only: `SchemaRenderer` strips an `objectFields` key authored in the schema
  (objectui#8818), so no view author can hand the grid a catalogue.

The pending objectui#10583 changeset lists the host-fetched window under "Not covered",
and the pending objectui#10657 grid changeset says that window stays not covered. Neither
holds once this change ships with them.

This is defence in depth. The real guard is still the server: ObjectStack's read mask
replaces `secret` and `password` values with its mask before they reach the browser.
