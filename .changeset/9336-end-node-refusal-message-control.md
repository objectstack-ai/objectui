---
'@object-ui/app-shell': minor
---

Give the flow `end` node's inspector a typed control for `config.message`, the key a
refused outcome requires (objectui#9336).

`EndConfigSchema` cross-validates `outcome` and `message` in **both** directions:
`outcome: 'refused'` **requires** a `message` (a refusal nobody can explain is the shape
that contract exists to replace), and `outcome: 'completed'` — including an omitted
`outcome`, since the declared default resolves to `completed` — **refuses** one (a
completion renders nothing, so the key would be a silent no-op).

The form offered a typed control for `outcome` and none for `message`. Since
objectui#9278 made Outcome a closed two-option dropdown, `refused` is one click away —
and picking it, with nothing else done, produced a flow that **fails to load**, because
the one key that outcome requires was authorable only through the Advanced (JSON) block.
That was a blocked authoring path, not a missing nicety.

The `end` group now offers **"Why the run was refused"** — a `textarea`, gated on
`showWhen: { field: 'outcome', equals: ['refused'] }`. The kind, label, placeholder and
help are derived from the installed spec rather than chosen: `EndConfigSchema` describes
`message` as a `{token}` template "interpolated at run time exactly like a screen
`description`", and that field is a `textarea` in this same table (as is the sibling
`message` key on `notify`).

The gate is what makes the pair authorable in **both** directions. An unset `outcome`
resolves through the declared `completed` default, so the field stays off screen until
the author actually picks `refused`; a **stored** `message` re-shows it regardless
(objectui#6499's stored-value rule), which is the only way an author can clear a stale
message after switching back to `completed`. Clearing deletes the key rather than
storing `''` — the empty string is refused under *both* outcomes.

The Outcome field's help (English and the zh-CN overlay) no longer says the message is
"set in Advanced", since it no longer is.

Not addressed here: objectui#9335, the same group's `outputVariable` row — a key
`EndConfigSchema` refuses by name. That row is deliberately untouched and remains open.
