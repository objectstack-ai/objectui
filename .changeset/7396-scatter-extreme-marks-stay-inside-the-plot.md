---
'@object-ui/plugin-charts': patch
---

Reserve a margin at both ends of a scatter's numeric axes, so an extreme mark is drawn
wholly inside the plot area (objectui#7396).

Both scatter axes are numeric and carry no explicit domain, so recharts fits the domain
to `[dataMin, dataMax]` and maps it across the whole plot box. A row at either extreme
is therefore **centred on the boundary**, and since a mark has a radius, about half of
each extreme symbol paints outside the plot area — the half-dots hugging both edges of
the Chart Gallery scatter.

Measured on that scatter ("Estimate vs Progress") in real Chromium — viewport 1440,
widget svg 510x350, plot area x 53..505 / y 5..296:

- before: marks at cx 53, 256.4, 301.6, 414.6, 459.8, 505 with the y-max row at cy 5,
  radius 4.514px. The first and last sit exactly on the x boundary and the y-max one on
  the top boundary, each overhanging its edge by a full radius.
- after: cx 65, 257.6, 300.4, 407.4, 450.2, 493 with the y-max row at cy 17. The worst
  case now clears its nearest edge by 7.486px, on both axes.

The card reported the x axis; the y axis clipped the same way and is fixed with it.

**The domain is not touched.** The margin is reserved as recharts' axis `padding`, which
insets the pixel range the scale maps into and leaves the domain alone, so every tick
**value** is unchanged — the axes still read 0/25/50/75/100 and 0/15/30/45/60 — and only
the mapping moves. Padding the domain instead would invent unround tick endpoints, and it
would write the same recharts prop a spec-declared `min`/`max` needs (objectui#9675), where
whichever landed second would shadow the other.

The margin is sized to the largest radius the scatter's declared symbol-area envelope
admits, not to the radius drawn today, so neither a change in recharts' own default mark
size nor a future variable-size mark can reopen it.

Every scatter's marks shift inward by that margin; nothing else about the chart changes.
