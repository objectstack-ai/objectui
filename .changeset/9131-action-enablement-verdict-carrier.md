---
'@object-ui/components': minor
---

fix(components): `action:button` / `action:icon` keep their own enablement verdict through `SchemaRenderer` (objectui#9131)

An action the author declared disabled was still clickable on the ordinary rendering
path. Both renderers computed `disabled` from the schema and then spread
`{...toFormControlDomProps(rest)}` after it; that helper forwards `disabled`
deliberately (the host is a form control) and `pickDomProps` iterates `Object.keys`,
so a `disabled` key PRESENT with the value `undefined` re-declared the computed value
and won. `SchemaRenderer` always forwards exactly that shape —
`disabled: __disabled || undefined`, the key unconditional and only the value
conditional — so whenever the node gate had nothing to say, the renderer's own verdict
was overwritten with `undefined` on the way to the DOM.

The loss was total on the legacy non-spec `enabled` leg, because the node gate never
consults `enabled`: measured, a plain literal `enabled: false` (no envelope, no CEL
dialect, no config bag) was disabled on a direct mount and NOT disabled through
`SchemaRenderer`, at node level and in the `properties` bag alike. The direction is
fail-OPEN — the author wrote a gate and the control stayed pressable. The spec
`disabled` / `disabledOn` leg lost nothing visible, because the node gate evaluates the
same key and forwards the same answer.

Both renderers now take the host verdict by name (`disabled: hostDisabled`) so it never
reaches the DOM spread, and OR it into the one computed carrier. This is exactly the
repair objectui#7238 made on `ui:button` and `form`; these two renderers were not among
the seven it covered. `disabled` stays in the form-control pass-through list — the
defect was the order plus "a present key wins", not the forwarding.

**Minor rather than patch, on the stored-data test.** No document moves and no API is
removed, but metadata already published renders differently: an `action:button` /
`action:icon` carrying `enabled: false` (or an `enabled` predicate that evaluates
false) becomes disabled where it used to be live. A host that passes `disabled={false}`
to these two renderers directly no longer re-enables a control their own gate disabled,
which is the same precedence change objectui#7238 shipped. Not carried as
`**BREAKING**`: it makes an existing declaration true rather than redefining or
retiring one.
