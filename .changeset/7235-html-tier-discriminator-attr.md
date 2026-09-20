---
'@object-ui/sdui-parser': minor
---

Refuse an authored `type=` attribute on the `kind:'html'` tier (objectui#7235 — the
port of objectstack#13957, maintainer ruling 2026-09-01, recorded as an append-only
amendment on ADR-0080).

**Breaking, deliberately, and the direction is a narrowing.** On this tier the tag
name *is* the node's `type`, so an authored `type=` attribute is a name collision
with the envelope's own discriminator. It is now one `forbidden-attr` error naming
both the tag and the attribute, and the node is composed as `{ ...props, type: tag }`
so the tag always wins the slot.

Two outcomes it replaces, the first of which produced no diagnostic at all:

- the value named another **registered** type (`<flex type="grid">`) — the tree
  carried `type:'grid'`, the manifest resolved it, every check passed, and a grid
  rendered where the author wrote a flex. Zero diagnostics.
- the value named **nothing registered** (`<object-chart type="bar">`) — loud, but
  `unknown-component` naming `"bar"` read as a missing plugin rather than as an
  attribute that should not be there.

The existing `forbidden-attr` code is reused rather than a new one minted: the two
copies of this parser (this one, which the renderer and the console's live edit
preview run, and objectstack's, which the save gate runs) are held to one diagnostic
vocabulary by `check:sdui-lockstep`, and a code minted on one side only is the dialect
split that gate exists to catch.

⚠️ Not carried over: the react tier's `specType` rescue (objectui#2880). The ruling
declined it by name; that rescue stays where it lives.

One visible non-behavioural consequence of the reversed spread: a compiled node's
`type` key is now **last** rather than first in insertion order, so `JSON.stringify`
of a parsed tree emits the same pairs in a different order. The key set, every value,
the children and the html-tier provenance marker are unchanged.
