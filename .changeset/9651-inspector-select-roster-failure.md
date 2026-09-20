---
'@object-ui/app-shell': patch
---

Inspector selects stop reading a FAILED option roster as a roster that answered
"your value is not here" (objectui#9651).

objectui#8862 gave `InspectorSelectField` a `loading` term, so a valid stored
value is no longer flagged while its roster is in flight. A fetch that FAILS
leaves the same residue as a successful fetch that found nothing — an empty
`options` array with nothing in flight — so the flag still fired, and unlike the
pending window it never cleared. A correctly bound key wore
`VALUE (not in object)` permanently, and nothing on screen said the request had
failed, so the author could not tell a broken fetch from a retired field. The
two call for opposite responses.

Measured on the unrepaired tree, driving the real `ViewColumnInspector` against
a rejected `client.get`: the field-key trigger read `amount (not in object)` for
a field the object really has, with no element carrying `role="status"` anywhere
in the render.

The repair is a change of SHAPE, not another flag. A second boolean beside
`loading` re-creates the defect one size larger: three facts in two booleans is
how this arrived, and four facts in three booleans leaves five combinations
nothing defines. `InspectorSelectField` now reads one discriminated state — the
`LoadState` union the metadata-admin loaders already share (objectui#5170,
objectui#5169) — through an exhaustive switch, so there are no combinations left
to leave undefined and a new arm on that union stops compiling here rather than
falling silently into an existing answer. The `loading?: boolean` prop is
replaced by `roster?: LoadState<unknown>`; omitting it still means "synchronous
roster, already answered", which is what the call sites with a literal `options`
array pass.

What the field DOES on a failure follows what this tree already decided a picker
owes its host, rather than being invented here: the shared `PickerLoadFailure`
block (objectui#5170) states that the list could not be loaded, shows the cause,
claims nothing about whether options exist, and leaves the control editable. The
inspector row now does the same three things in the space it has — the stored
value stays legible and unflagged, a notice names the failure and its cause, and
the picker stays editable, because a failed catalog must not also block
authoring. Suppressing the flag alone would have traded a wrong message for no
message.

Threaded at the four `InspectorSelectField` call sites that take an async roster,
each from the `error` its own loader has published all along and every one of
them dropped: `ViewColumnInspector`'s field-key picker (`useObjectFields`),
`ReportDefaultInspector`'s dataset binding (`useDatasetCatalog`), and both of
that inspector's chart axes (`useDatasetSemantics`). The pair-to-state adaptation
is written once, as `rosterFrom`, so the precedence it encodes — a reported fault
outranks an in-flight retry — cannot be re-derived differently at each site.

`InspectorComboField` keeps its own boolean `loading` and is deliberately not
changed: that prop only picks the trigger's placeholder text, it decides no claim
about the author's data, so it has no fault arm to be blind to.
