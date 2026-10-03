---
'@object-ui/types': minor
'@object-ui/react': minor
'@object-ui/core': minor
'@object-ui/components': patch
---

A node slot and `SchemaRenderer`'s `schema` prop take the union of the declared node types, `DeclaredNode` (objectui#11466).

**BREAKING (TypeScript authoring face only), shipped as `minor` per this repository's version policy.** `SchemaNode` was `BaseSchema | string | number | boolean | null | undefined`, and the prop was `BaseSchema | AuthoringNode | string | null | undefined`. Both object members are now `DeclaredNode`, a new export of `@object-ui/types`: the discriminated union, keyed by the literal `type`, of

- every component schema `AnySchema` declares, without its `BaseSchema` arm (whose `type` is `string`) and without `AppComponentSchema` (the app-level document, which `AppSchemaRenderer` reads structurally and `ComponentRegistry` never dispatches: as a node, `type: 'app'` is the stored page of that kind);
- every spec-declared `AuthoringNode`;
- every type an application declares in the new `CustomNodeRegistry` interface.

There is no `type: string` arm and no index signature. What moves:

- A node whose `type` no declaration names is refused, nested or at the prop: `{ type: 'card', children: [{ type: 'txt' }] }` no longer compiles. So is a value typed `BaseSchema`, which names no declared type.
- An inline child is checked against its own type's arm wherever it is nested, so a misspelled key on a node type without an index signature (the `AuthoringNode`s, a closed `CustomNodeRegistry` entry) is refused at the slot. Node types that extend `BaseSchema` keep its index signature until objectui#8347 removes it.
- A node's REQUIRED keys are required (a stored `home` page document needs its `label`, a `data-table` its `columns`), because no `BaseSchema` arm accepts the same literal structurally any more.
- `app` and `list` are one arm each: `PageDocumentNode` admits every page kind but the interface-mode `list`, which `PageView` renders through `InterfaceListPage` and never hands to `SchemaRenderer`. Narrowing a `DeclaredNode` on `type === 'app'` gives `PageDocumentNode`, and on `'list'` gives `ListSchema`. `SchemaByType` reads `AnySchema` and does not move.
- `@object-ui/core`'s schema builder takes `DeclaredNode` where it took `BaseSchema`: `.child()` / `.children()` on the grid and flex builders and the card builder's `.content()`.
- `toRenderableSchema` (`@object-ui/react`) follows `SchemaNode` and the prop by reference.

What does NOT move: every zod face (`AnyComponentSchema`, `SchemaNodeSchema`, the strict authoring face) and every runtime path. `zod/base.zod.ts` writes the node slot's zod type out through type aliases so the declared-node union can name the zod-derived `AuthoringNode`s without a circular reference; the schema objects are unchanged. `FlexBlockNode` is now an interface for the same reason, with the same members. `@object-ui/components`' `kind: 'html'` page crosses its runtime-parsed tree into `DeclaredNode` at one documented boundary, after `validateTree` reports no error; it renders exactly what it rendered.

**Migration.** Annotate a node with its declared type, or with `DeclaredNode` where any node goes. Declare each type you register with `ComponentRegistry` in `CustomNodeRegistry`:

```ts
import type { BaseSchema } from '@object-ui/types';

interface MyWidgetSchema extends BaseSchema {
  type: 'my-widget';
  customProp?: string;
}

declare module '@object-ui/types' {
  interface CustomNodeRegistry {
    'my-widget': MyWidgetSchema;
  }
}
```

An entry joins the union under its KEY (the arm is the entry intersected with `{ type: KEY }`), so it never adds a `type: string` arm. A value built at runtime whose `type` the compiler cannot know is narrowed to a declared type, or crosses at one validated boundary, as the html-tier page does.
