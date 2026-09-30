---
'@object-ui/types': minor
---

feat(types): `TooltipSchema.content` is text only, on both faces (objectui#10295)

**BREAKING (authoring):** a node authored at a tooltip's `content` is now refused.
Author rich content under `children`, the tooltip's rich-content slot:

```json
{ "type": "tooltip", "trigger": { "type": "button", "label": "Hover me" },
  "children": { "type": "text", "content": "Rich body" } }
```

Both the TypeScript declaration and the zod mirror accepted `content` as
`string | SchemaNode`. The tooltip renderer places `content` directly in the
tooltip body, without `renderChildren`, so a node there crashed the tooltip with
"Objects are not valid as a React child". `@objectstack/spec` declares no tooltip
node, so the key follows its read site: the declaration is now `content?: string`,
and the mirror refuses a non-string (`invalid_type` at `content`) with a message
that names `children`. objectui#10280 had already refused the list arm for the same
reason. A tooltip whose `content` was a node never rendered, so no working document
changes behaviour.

When both are authored, a non-empty `content` wins and `children` is not rendered;
that is how the renderer reads them today, and it is now written into the
declaration's JSDoc and the tooltip docs.
