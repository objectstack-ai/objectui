---
'@object-ui/app-shell': patch
---

Flow-node inspector: a select config control now shows the declared default as its
trigger placeholder when the node omits the key (objectui#6830 arm A "show, do not
write", select half — the counterpart of objectui#8451's boolean half).

Before this, `case 'select'` drew `value != null ? String(value) : ''` and offered
the primitive no placeholder, so an unset key sat on `InspectorSelectField`'s own
em-dash — the "nothing is selected" mark — whatever the descriptor declared. Seven
of the ten declaring fields are select-kind, so on a fresh `wait` node the inspector
showed an empty "Wait for" while already revealing the timer-only Duration field its
declared `'timer'` default admits: one panel making two different claims about the
same unset key.

The trigger now states the value in effect: the stored option, or — when nothing is
stored — the option LABEL for the `defaultValue` the descriptor declares, drawn
through the primitive's placeholder slot so it stays muted and flagged
`data-placeholder`. An author can still tell "nothing is stored, this is what
happens" from "I picked this". A declaration naming no offered option falls back to
the raw value rather than disappearing. Both writers of the property feed it: the
hand-written descriptor table and the engine-published `configSchema` that
`json-schema-to-fields` converts.

**Nothing is written.** The placeholder is text on the trigger; the draft the
inspector is handed is unchanged byte for byte by a render, and the first author
edit commits an explicit value exactly as before. `InspectorSelectField` itself is
untouched — it already owns when a placeholder shows (empty value, no caller-offered
"none" row), so a stored value can never be shadowed by one.

`patch`, not `minor`: no prop, option or metadata key is added, and no authored
document changes meaning. What changes is that seven controls stop contradicting
what the runtime does with metadata that already parses.

Also corrects `FlowConfigField.defaultValue`'s doc comment, which claimed two read
sites; there are three, and the comment now names them.
