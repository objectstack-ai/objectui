---
'@object-ui/app-shell': patch
---

fix(app-shell): the Studio copilot's "discussing" chip reads the item's label, with its internal name on the tooltip

In Studio, the AI chat dock's chip above the composer printed the internal
identity of the item being discussed (for example
`Discussing: dashboard · customer_dashboard`). When an item is open in the
Interfaces pillar, the chip now reads that item's display label, and the
internal `type · name` pair is kept on the chip's tooltip. Items without a
label, and the other pillars, still read `type · name`.

The data the chat sends to the agent as its surface context is unchanged: the
label is display-only and never sent.
