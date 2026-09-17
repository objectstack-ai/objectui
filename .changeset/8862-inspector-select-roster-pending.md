---
'@object-ui/app-shell': patch
---

Inspector selects stop calling a valid stored value "not in object" while their
option roster is still loading (objectui#8862).

`InspectorSelectField` decided "this stored value is not offered" by testing
membership in the `options` array it was handed, and that array cannot say WHY
it is empty. An async picker mid-round-trip hands over `[]`, indistinguishable
from a catalog that genuinely does not carry the value — so for the length of a
fetch a correctly bound key was rendered under a marker asserting it does not
exist. On the metadata-authoring surface that is not a cosmetic wobble: it tells
the author their binding is broken, and the plausible response is to re-author
one that was already right. It self-corrected when the response landed.

The primitive gains the term it was missing, `loading` — spelled the way the
sibling atom `InspectorComboField` already spells the same signal — which makes
its answer a tri-state: roster answered and the value offered (the option's own
label), roster answered and the value absent (the value under
`unknownValueLabel`, unchanged), roster not yet answered (the value, bare). The
synthesised row still renders in the pending arm, so the trigger never goes
blank and the stored value stays re-pickable; only the CLAIM is withheld.

Threaded at the three call sites measured to reach the defect, each from the
`loading` its own loader already published:

- `ViewColumnInspector`'s field-key picker (`useObjectFields`) — the reported
  reproduction, which read `FIELDKEY (not in object)` until the object's field
  list arrived.
- `ReportDefaultInspector`'s dataset binding (`useDatasetCatalog`).
- Both of that inspector's chart axes (`useDatasetSemantics`), whose sibling
  `DatasetNamesEditor` at the same call site already consumed the signal.

`ActionTargetField` (`useMetaOptions`) was named on the card and measured NOT to
reach it: its `options.length > 0` gate renders a text input while the roster is
empty, so the select never mounts during the round trip. Every other
`InspectorSelectField` call site either takes a synchronous roster or is behind
the same kind of length gate; the async rosters that are not go to
`InspectorComboField`, which has no absence marker to withhold.

Still open and deliberately not guessed here: a roster whose fetch FAILED also
resolves to an empty array with `loading` back to false, so the marker still
fires on a load error. objectui#5170 ruled that arm for the SchemaForm widget
family and chose a dedicated failure surface over a silent empty roster; the
same question on this primitive is a decision about what a picker owes its host,
not a spelling.
