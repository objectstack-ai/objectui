---
---

Delete the scatter branch's inert `<ZAxis type="number" range={[60, 400]} />`
declaration (objectui#9681). Recharts' `selectZAxisWithScale` drops a z axis
carrying no `dataKey` before it reaches a mark, so the declared area envelope
never applied and every mark was painted at recharts' own implicit default
size. ⛔ No package is released by this change: nothing rendered moves, and no
authored value was ever read through the deleted prop.

The declaration's only effect was on readers, and it had already cost one — the
triage comment on objectui#7396 derived a variable-bubble-size prediction from
it whose every clause was false. So the delete is paired with a test that states
the painted mark size as a reading taken off a render
(`AdvancedChartImpl.scatterSymbolSize-9681.test.tsx`), and the prose that sized
objectui#7396's edge margin to the envelope's upper bound is repaired to name
that number as a headroom budget rather than as something the tree declares.
The margin itself is unchanged, deliberately: it is the envelope a variable-area
scatter would have to stay inside, so it already survives the day mark area
becomes configurable.
