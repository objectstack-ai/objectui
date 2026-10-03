---
'@object-ui/react': patch
---

`toRenderableSchema` declares its parameter as `SchemaNode` (objectui#11479).

The parameter used to spell out `SchemaNode`'s members one by one. It now names the union itself, so it follows `SchemaNode` instead of keeping a hand-written copy of it. Nothing it accepts changes today: the two spellings are the same type, and the function's return type and behaviour are untouched.

⚠️ **Dated note, 2026-10-02 — the parameter narrows with `SchemaNode` — objectui#11466.** At this change the parameter's two spellings were the same type and nothing it accepted changed; now, later in this same release, `SchemaNode`'s object arm is `DeclaredNode`, the union of the declared node types, so the parameter follows it and no longer accepts a value typed `BaseSchema`. That is the point of naming the union instead of copying it. The rest of this entry is kept as the reading of this change.
