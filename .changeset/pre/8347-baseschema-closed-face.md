---
'@object-ui/types': minor
'@object-ui/plugin-kanban': patch
'@object-ui/plugin-timeline': minor
---

**`BaseSchema` no longer declares `[key: string]: any`** (objectui#8347, executing the objectui#7927 ruling: the TypeScript face is a contract). Every node type extends `BaseSchema`, so a node literal annotated with its node type now refuses a key that no declaration names, a misspelled key included, where it used to type it `any`. The correct spelling compiles as before.

**Clause-②: yes (narrowing)**, shipped as `minor` per this repository's version policy. The removal narrows the TypeScript authoring face of every node type; the `visibleWhen` change below widens both faces to the envelope the spec's own parse writes.

- **What does not move.** The zod faces keep their accept sets for every key but `visibleWhen`: the tolerant mirror is still `.passthrough()`, so `safeValidateSchema` keeps an undeclared key, and the derived strict face refuses it as before. `ComponentRendererProps`, the renderer props type, keeps its own index signature. Nothing a renderer draws changes.
- **The bound.** TypeScript runs its excess-property check only on a fresh object literal. A value that reached its annotation through a variable of a wider type is not re-checked.
- **`PartialSchema<T>` works as written.** With the signature gone, `keyof T` is the literal member union again, so the alias keeps `T`'s declared members, optional, with `type` required. While the signature stood it declared `type` alone (objectui#6397).
- **`BaseSchema.visibleWhen` is the spec's `EvaluatedExpressionInput`**, by reference: a predicate string, or the `{ dialect, source }` envelope. The zod twin takes `EvaluatedExpressionInputSchema`'s verdict without its transform, so a string parses to itself. A dialect-less envelope, an unknown dialect and a blank predicate are refused, as the spec refuses them. Both faces read `string` before, which refused the envelope a spec parse writes into this key.
- **`@object-ui/plugin-kanban`.** `ObjectKanban` reads the `sort` the element data-source gate writes through a read type private to the package. `ObjectKanbanSchema` still declares no `sort` (objectui#8174). Nothing drawn changes.
- **`@object-ui/plugin-timeline`.** `TimelineRenderSchema`, the `schema` prop type of the exported `TimelineRenderer`, gains one optional member: the `onItemClick` slot `ObjectTimeline` composes. That is a one-member optional widening of an exported prop type. `TimelineSchema`, the authoring face, still declares no `onItemClick`. Nothing drawn changes.

**Migration.** Where a literal stops compiling, the key is misspelled (fix it) or not declared on that node type (declare it on the type that reads it, by reference to the `@objectstack/spec` row, or remove it). Do not cast past the error. `props`, the legacy alias of `properties`, is not declared on the TypeScript face; the renderer still reads it, so write `properties`.
