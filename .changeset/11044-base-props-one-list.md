---
'@object-ui/sdui-parser': minor
---

The base-prop list is declared once, and the renderer's `visibleWhen`, `hiddenOn` and `testId` join it (objectui#11044).

`validateTree` and `generateDts` each kept their own hand-written list of the base props: the `BaseSchema` keys a node may carry without its registration declaring them. The two lists had drifted. After objectui#11008 the validator accepted `bind` and `hidden` on every node, while the generated JSX types (`SduiBaseProps` in `sdui-intrinsics.d.ts`) still refused both (`TS2322 … Property 'bind' does not exist`). Both now read one exported list, `SDUI_BASE_PROPS`, and the generated `SduiBaseProps` interface is emitted from it.

Three changes to what is accepted come with it:

- **`visibleWhen`, `hiddenOn` and `testId` are base props of every node.** `BaseSchema` declares all three, no registration declares any of them, and `SchemaRenderer` reads them for every node. It evaluates `visibleWhen` and `hiddenOn` in its hide chain, and it re-emits `testId` as `data-testid`. `validateTree` answered each with an `unknown-prop` warning on every registered type. Now none of them draws a diagnostic, and the generated JSX types accept them, along with `bind` and `hidden`. The canonical ADR-0089 predicate, `visibleWhen`, used to warn while the deprecated `visibleOn` was silent. A near-miss spelling such as `testid` still draws `unknown-prop`.
- **`name`, `label`, `description`, `placeholder`, `data` and `ariaLabel` are base props where a type does not declare them.** Some registrations declare each of these `BaseSchema` members as a typed input. On those types the declared input wins, and a wrong-typed value still draws `type-mismatch`. On every other type the key no longer draws `unknown-prop`. In the generated JSX types, an interface that declares one of these keys extends `Omit<SduiBaseProps, …>` for it, so its declared type is the one an author compiles against.
- **The cost is named.** On a type that does not declare one of the six keys, the parser tier no longer reports it, whether or not the renderer reads it. For example, `description` on `page-header` is the retired alias of `subtitle` (objectui#3226), and it used to draw `unknown-prop`. It now draws nothing.

`SDUI_BASE_PROPS` and its `SduiBaseProp` / `SduiBasePropScope` types are new exports. Each entry names a `BaseSchema` member, the scope it is a base prop in (`'every-node'` or `'where-undeclared'`), and its type in the generated JSX surface.
