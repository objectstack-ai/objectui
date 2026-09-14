---
'@object-ui/app-shell': patch
---

Correct the flow `loop` node's "Item variable" hint to the identifier the spec applies.

The Studio inspector's `loop` group hinted `currentItem` in its "Item variable" box while
`LoopConfigSchema` applies a different identifier to the omitted key. A `text` control's
placeholder is drawn muted and never written, so what it states is precisely *the name you
get if you leave this blank* — and it named the wrong one. An author who read the hint and
wrote that reference in the loop body got an **unresolved reference at run time**, because
the blank box let the schema's own default bind instead.

The hinted identifier was never invalid — typed into the box it is accepted and stored
verbatim, and a stored one still round-trips untouched. The defect was the hint describing a
name the author had to type, in a slot that means the opposite. The `map` twin already agreed
and is unchanged; it is now pinned as a live control so a drift on either group reddens.

⛔ Not repaired by declaring a `defaultValue`: a `text` control reads `placeholder` and none
of the three sites that read a declared default, so such a declaration would be inert on
screen. Wiring `text` / `number` controls to read it is objectui#9109's fence 4, not this
change.
