---
'@object-ui/app-shell': patch
---

Make `InspectorSelectField`'s `placeholder` reach the rendered trigger
(objectui#8450). Every empty select in the metadata-admin designer drew a BLANK
trigger instead of its hint.

The field bridges a caller's `''` through an internal sentinel so a "— None —"
option can exist at all (Radix `<Select.Item value="">` throws). That bridge also
guaranteed the value handed to Radix was never `''` or `undefined` — the only two
values for which Radix renders `SelectValue`'s placeholder — and a controlled
value matching no `SelectItem` renders as nothing. So the declared `'—'` default
was unreachable at all 45 call sites, none of which passes a placeholder of its
own.

The trigger now renders the placeholder itself, on the narrow state that means
"nothing is selected": no value AND no option standing for none. Where the caller
DOES offer a `''` row, that row is a selection and its label still wins,
unchanged. A non-empty value matching no option also still renders blank —
that is a stale value, not an empty one, and is out of this change's scope.

Measured effect on the designer: 13 of the 45 call sites can be empty without
offering a "none" row, and those now show `'—'` where they showed nothing — the
flow-node config selects, the app-nav item type, the curated page-block props,
the report dataset/chart-axis pickers and the action target/variant/mode/component
pickers. The other 32 render exactly as before.

⚠️ **Dated note, 2026-09-29 — the call-site figures above have since moved —
objectui#6830, objectui#7551 and objectui#7597.** "all 45 call sites, none of which passes
a placeholder of its own" above held when this change landed (`0c4694437`): 45
`InspectorSelectField` mounts in 13 files, none passing a `placeholder`. Later in this
same release objectui#6830 (PR objectui#9110) made the flow-node config select pass its
declared default as its `placeholder`, so a flow-node select whose descriptor declares a
default shows that default rather than `'—'`; and objectui#7551 (PR objectui#9972) and
objectui#7597 (PR objectui#10527) each added a mount, the action inspector's operation
select and the field inspector's `valueDomain` select, both of which offer a `''` row.
Re-measured for objectui#10979 on `main` at `2eaf5be27`, there were 47 mounts in 13
files, one of them passing a `placeholder`. This note does not re-classify the 45, so "13
of the 45" and "The other 32" above stay the reading of this change.
`.changeset/6830-flownode-select-declared-default.md` (PR objectui#9110),
`.changeset/7551-action-operation-update-executor.md` (PR objectui#9972) and
`.changeset/7597-field-inspector-value-domain.md` (PR objectui#10527) state what ships;
the text above is kept as the reading of this change.
