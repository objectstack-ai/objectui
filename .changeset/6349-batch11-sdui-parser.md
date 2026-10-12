---
'@object-ui/sdui-parser': minor
---

The node type of the tree this package's parser produces is declared and exported as `ParsedSchemaNode` instead of `SchemaNode` (objectui#6349, batch 11). `@object-ui/types` publishes a different `SchemaNode`: the closed authoring union, discriminated on a literal `type`, with no index signature and with numbers, booleans and `null` admitted as children. The parser's node is an open, as-parsed `SchemaElement` (any `type` string, the keys as authored) or a text string, and neither type is assignable to the other. One exported name stood for both across the two packages, and types keeps it.

**Type change, breaking for some consumers.** `SchemaNode` is no longer exported from `@object-ui/sdui-parser`. Replace `import type { SchemaNode } from '@object-ui/sdui-parser'` with `ParsedSchemaNode`; it is the same type (`SchemaElement` or a string). The old import fails to compile with TS2305 ("has no exported member 'SchemaNode'"). `SchemaElement`, `ParseResult` and every function keep their names and shapes.

No runtime behaviour changes.
