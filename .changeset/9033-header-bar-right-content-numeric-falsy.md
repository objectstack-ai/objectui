---
'@object-ui/components': patch
---

`ui:header-bar` no longer paints a stray `"0"` beside the header chrome when
`rightContent` is authored as a falsy number (objectui#9033).

`HeaderBarSchema.rightContent` is declared `SchemaNode` on both published faces — the
interface in `@object-ui/types`, and its Zod mirror, whose node union carries a `z.number()`
arm — so `0` is an authorable value for the slot. The renderer guarded it with an `&&` chain
whose left operand is the raw slot value, and with `rightContent: 0` that chain evaluates to
the **number** `0`, which React renders. Measured: `{ type: 'header-bar', title: 'H',
rightContent: 0 }` painted `"Toggle Sidebar0"`.

This is the numeric-falsy JSX trap objectui#8331 measured and closed one slot over on
`DataTableSchema.emptyAction`, and the fix is that same shape rather than a second one: the
`&&` chain becomes a ternary yielding `null`. The **truthiness** leg stays rather than
becoming nullish. Both land on the same rendering today — since objectui#8908
`toRenderableSchema` maps a falsy primitive onto nothing rather than onto its `String` form
— so the choice is about which rule the slot states, and truthiness is the rule that keeps
this slot's answer independent of the bridge. That independence is exactly what kept the
sibling slot out of the defect while the bridge was wrong.

Narrower than it may read, and stated precisely so the repair is not judged by the wrong
row: only the falsy **numbers** leaked. `0` and `-0` painted the character `0`, `NaN` painted
the three characters `NaN`. `false` and `''` were already correct — React ignores `false` as
a child — and cannot discriminate the two worlds.

Adjacent but **not** this defect: objectui#8908 repaired the bridge so a falsy primitive
renders nothing. That repair does not reach this line and never could, because `&&`
short-circuits and the chain produces the raw `0` before any bridge is called. Same symptom,
different mechanism.

The declaration is untouched — objectui#7105 ruled node slots relax the renderer rather than
narrow the declaration, and a `typeof === 'object'` test here would silently drop a bare
string the slot renders as its own text.

Scored `patch`: no new capability, a slot that painted a character it was never asked to
paint stops painting it.
