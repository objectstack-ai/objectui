# AI-Driven Project Structure

This document defines the directory structure designed to facilitate AI-driven development. The goal is to establish a deterministic 1:1 mapping between the ObjectQL specifications (in `docs/objectql`) and the source code.

## 1. Top-Level Structure (Monorepo)

We use a standard Monorepo structure managed by `pnpm`.

```
/
├── apps/                   # End-user applications
│   ├── design-studio/      # The visual designer (Next.js/Vite)
│   └── docs/               # Documentation site
├── packages/               # Shared libraries
│   ├── protocol/           # (New) Pure Metadata Definitions & Types
│   ├── engine/             # (New) The Core Logic (State, Data, Expressions)
│   ├── ui/                 # (New) The Atomic Component Library (Shadcn + Tailwind)
│   └── renderer/           # (Renamed from react) The Schema->React Transformer
├── docs/
│   ├── objectql/           # The Source of Truth (Specs)
│   └── spec/               # Technical Specs
```

## 2. Package Responsibilities

### `@object-ui/protocol` (was `core`)
**Goal**: Define the "Language" of ObjectQL.
**Mapping**: `docs/objectql/*.md` → `packages/protocol/src/*.ts`

*   `src/types/object.ts` (Defines ObjectConfig)
*   `src/types/field.ts` (Defines FieldConfig)
*   `src/types/view.ts` (Defines ViewConfig)
*   `src/types/page.ts` (Defines PageConfig)
*   `src/utils/validator.ts` (Zod schemas for runtime validation)

### `@object-ui/engine` (was `react` internals)
**Goal**: The "Brain". Headless logic for handling data.

*   `src/store/` (Zustand stores for Object data)
*   `src/data-source/` (React Query wrappers)
*   `src/expressions/` (Expression evaluator)
*   `src/context/` (DataScope implementation)

### `@object-ui/ui` (was `components`)
**Goal**: The "Look". Dumb, stateless UI atoms.
**Tech**: Radix UI + Tailwind + Shadcn.

*   `src/primitives/` (Button, Input, Dialog)
*   `src/layout/` (Grid, Stack, Card)

### `@object-ui/renderer` (was `react` public)
**Goal**: The "Compiler". Turns Metadata into UI.
**Structure**: Strictly organized by Schema Type.

```
src/
├── renderers/
│   ├── page/
│   │   ├── PageRenderer.tsx
│   │   └── index.ts
│   ├── object/
│   │   ├── ObjectFormRenderer.tsx
│   │   ├── ObjectTableRenderer.tsx
│   │   └── ...
│   ├── view/
│   │   ├── ViewRenderer.tsx  (Dispatcher)
│   │   ├── ListView.tsx
│   │   ├── KanbanView.tsx
│   │   └── ...
│   └── field/
│       ├── FieldRenderer.tsx (Dispatcher)
│       ├── StringField.tsx
│       └── SelectField.tsx
├── registry.ts               # Maps types to renderers
└── SchemaRenderer.tsx        # Entry point
```

## 3. Workflow for AI

When asked to "Implement the View spec":

1.  **Read** `docs/objectql/view.md`.
2.  **Define** `packages/protocol/src/types/view.ts`.
3.  **Create** `packages/renderer/src/renderers/view/ViewRenderer.tsx`.
4.  **Register** it in `packages/renderer/src/registry.ts`.
