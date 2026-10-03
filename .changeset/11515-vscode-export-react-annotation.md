---
'object-ui': patch
---

The VS Code extension's **Export to React** command types the `schema` constant it emits as `SchemaRendererProps['schema']`, imported type-only from `@object-ui/react` beside `SchemaRenderer` (objectui#11515).

Unannotated, every `type` in the constant widened to `string`. A `SchemaRenderer` prop that discriminates on the literal `type` refuses such a value, so the generated file stopped compiling as soon as the prop is narrowed to the declared node types (objectui#11466). Annotated, each `type` stays a literal and the schema is checked where it is written: a schema the prop does not accept is refused on the constant's own line. Measured with `tsc` against the built packages, the emitted file compiles today and with objectui#11466 applied.

`SchemaNode` was the annotation first proposed, and it does not fit: it also admits `number` and `boolean`, which the prop leaves out, so every generated file was refused at its one JSX line.

The compile pin gains a leg against the real prop type, read from `SchemaRenderer.tsx`, with a positive control. The two documented copies of the preamble (`DESIGN.md` and the docs page) follow it. The docs page's sample keeps its `h1` node: `h1` is a declared type (`HtmlElementSchema`), and the annotated sample compiles both today and with objectui#11466 applied.
