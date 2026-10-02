---
'@object-ui/react': patch
---

`toRenderableSchema` declares its parameter as `SchemaNode` (objectui#11479).

The parameter used to spell out `SchemaNode`'s members one by one. It now names the union itself, so it follows `SchemaNode` instead of keeping a hand-written copy of it. Nothing it accepts changes today: the two spellings are the same type, and the function's return type and behaviour are untouched.
