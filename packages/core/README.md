# @object-ui/core

Core logic, types, and validation for Object UI. Zero React dependencies.

## Features

- 🎯 **Type Definitions** - Re-exported runtime types; the component schema
  vocabulary itself is `@object-ui/types`
- 🔍 **Component Registry** - Framework-agnostic component registration system
- 🧮 **Expressions** - `${...}` expression evaluation against a context
- ✅ **Validation** - Zod-based schema validation
- 🚀 **Zero React** - Can run in Node.js or any JavaScript environment

## Installation

```bash
npm install @object-ui/core
```

## Usage

### Type Definitions

The component schema vocabulary lives in `@object-ui/types`. Core depends on
that package and does not re-export it, so import the types from there. The
page node type is `PageNodeSchema` — the SDUI node, as distinct from the
authored page document.

```typescript
import type {
  PageNodeSchema,
  FormSchema,
  InputSchema,
  BaseSchema
} from '@object-ui/types'

const mySchema: PageNodeSchema = {
  type: 'page',
  title: 'My Page',
  children: []
}
```

### Component Registry

```typescript
import { ComponentRegistry } from '@object-ui/core'
import type { ComponentRenderer } from '@object-ui/core'

// Your component, in whatever renderer shape the host framework uses.
declare const buttonRenderer: ComponentRenderer

ComponentRegistry.register('button', buttonRenderer)
const renderer = ComponentRegistry.get('button')
```

`ComponentRegistry` is a process-level singleton exported by `@object-ui/core`;
`SchemaRenderer` resolves every `type` against it, so a component registered
here is renderable from schema anywhere in the app. `register()`'s second
argument is the component itself; registration metadata is its optional third
argument, and `getMeta()` — not `get()` — reads that metadata back.

### Expressions

`evaluateExpression` evaluates a `${...}` expression against a context.

```typescript
import { evaluateExpression } from '@object-ui/core'

const isAdmin = evaluateExpression('${user.role === "admin"}', {
  user: { name: 'John', role: 'admin' },
}) // true
```

### Server Action Dispatch (`createServerActionHandler`)

`ActionSchema.body` (L1 expression / L2 sandboxed JS) executes **server-side**
— `POST /api/v1/actions/{object}/{action}` → the runtime sandbox. The client
dispatches; it never interprets a body. Build the dispatch handler with the
factory and register it — core stays opinion-free about auth, origin and
object scope, which are injected:

```typescript
import { createServerActionHandler } from '@object-ui/core'
import type { ActionRunner, ServerActionFetch } from '@object-ui/core'

// Injected by the host. Each stand-in is typed from the shipped surface, so
// this example is checked against the factory's own config rather than a copy.
declare const myAuthenticatedFetch: ServerActionFetch
declare const currentObject: string | undefined
declare const refetchData: () => void
declare const runner: ActionRunner

const script = createServerActionHandler({
  fetch: myAuthenticatedFetch,          // your auth wrapper (Bearer/cookies/...)
  baseUrl: 'https://api.example.com',   // '' or omitted = same-origin
  resolveObject: () => currentObject,   // fallback when the action has no objectName
  onRefresh: () => refetchData(),       // called per the action's refreshAfter
})

// Registered handlers beat the built-in executors:
runner.registerHandler('script', script)
// (React hosts: <ActionProvider handlers={{ script }} ... />)
```

The factory owns the protocol so consumers cannot drift on it: name-based
action identity (ADR-0110), the record-id resolution dance (`_rowRecord`,
`recordIdField`, selection fallback, aggregate `_selectedIds`), a re-entrancy
guard, and the `/actions` response-envelope rule (`interpretActionResponse` /
`readActionPayload`, also exported).

### System Views (`defineSystemView`)

Schemas authored in source code are part of the product contract and must
not be mutated at runtime. Wrap them with `defineSystemView()` to deep-freeze
the graph and tag it as a *System View*.

```typescript
import { defineSystemView, cloneAsOverride, isSystemView } from '@object-ui/core'

export const userListView = defineSystemView({
  type: 'list',
  data: { object: 'User' },
  columns: [{ name: 'email' }],
})

// @ts-expect-error readonly by defineSystemView — refused at compile time, not just at run time
userListView.columns.push({ name: 'name' }) // ❌ TypeError (strict mode)
isSystemView(userListView)                   // ✅ true

// To produce a Tenant- or User-level override, derive a mutable copy:
const draft = cloneAsOverride(userListView)
draft.columns.push({ name: 'name' })         // ✅ allowed
isSystemView(draft)                          // false — clone is no longer System
```

**View tiers (recommended layering):**

| Tier        | Source                | Mutable? | API                         |
| ----------- | --------------------- | -------- | --------------------------- |
| System View | code (`import` / `as const`) | ❌ frozen | `defineSystemView()`        |
| Tenant View | backend / DB          | ⚠️ admin only | `cloneAsOverride()` + persist |
| User View   | localStorage / API    | ✅ user-editable | `cloneAsOverride()` + persist |

`Date`, `RegExp`, `Map`, `Set`, and class instances passed via `props` are
intentionally **not** frozen so infrastructure objects keep working.

### Field-level read gate (`withoutDeniedFields`)

Field-level security gates what the renderer DRAWS (objectui#7215 /
objectui#7230): a value the loaded permission policy denies is not shown, even
when a backend serves it. `withoutDeniedFields` is that rule for one record —
call it on a row before building a display value from the whole row (a record
title, a lookup label, a search-hit label), so a denied field reads exactly as
an absent one.

```typescript
import { withoutDeniedFields } from '@object-ui/core'

// `policy` is structural: `usePermissions()` from `@object-ui/permissions`
// satisfies it, as does any `{ isLoaded, checkField }` object.
const policy = {
  isLoaded: true,
  checkField: (object: string, field: string) => !(object === 'account' && field === 'salary'),
}

withoutDeniedFields({ id: 'a1', name: 'Acme', salary: 100 }, policy, 'account')
// { id: 'a1', name: 'Acme' }

// A declared id field is kept without asking the policy, like `id` and `_id`:
withoutDeniedFields({ account_code: 'A-1', salary: 100 }, policy, 'account', ['account_code'])
// { account_code: 'A-1' }
```

- `id`, `_id` and every key in the optional fourth argument are never judged.
- Before the policy loads, with no policy, with no object name, or for a value
  that is not an object, the record comes back as it is.
- When nothing is withheld the SAME object comes back, so callers can tell the
  two cases apart by identity.

### Undo snapshot for an update (`captureUpdateUndoData`)

An `undoable` update restores exactly the fields it wrote, from their values
before the write. `captureUpdateUndoData` is the one rule for reading those
values off a record. `ActionRunner` uses it, and so should any surface that
builds its own `update` Undo operation.

```typescript
import { captureUpdateUndoData, type FieldContainerLike } from '@object-ui/core'

// The written object's field definitions, as its schema serves them
// (`objectSchema.fields`). Below, `status` is a text field, `account` a
// lookup and `config` a json field.
declare const fields: FieldContainerLike

captureUpdateUndoData(['status'], { id: 't1', status: 'open' }, fields) // { status: 'open' }
captureUpdateUndoData(['status'], { id: 't1', status: null }, fields)   // { status: null }
captureUpdateUndoData(['status'], { id: 't1' }, fields)                 // undefined

// A relation read with `$expand` is captured as its stored id.
captureUpdateUndoData(['account'], { id: 't1', account: { id: 'a1', name: 'Acme' } }, fields)
// { account: 'a1' }

// Any other field is captured as the record carries it, whatever its shape.
captureUpdateUndoData(['config'], { id: 't1', config: { id: 'c1', mode: 'strict' } }, fields)
// { config: { id: 'c1', mode: 'strict' } }
```

- A field counts as carried when it is an own key whose value is not
  `undefined`. A carried `null` is a real empty value and is captured.
- When any written field is not carried, the answer is `undefined` and the
  caller offers no Undo at all. A record projected by `$select`, or one the
  server stripped of fields the reader may not read, can lack a written field
  while the server holds a real value for it; a partial or `null` snapshot
  would overwrite that value on Undo.
- A field the object declares as a relation (`lookup`, `master_detail`,
  `user`, `tree`) is captured as the id it stores, and a `multiple` one as the
  array of ids. `$expand` puts the related record where the id was, and
  writing that record back into the reference is what Undo must never do.
  Which fields are relations is read from `fields`, never from the value's
  shape: a `json` field may hold an object with an `id`.
- `fields` is required. Pass `undefined` only when the caller has no field
  definitions for the object; nothing is then treated as a relation.

## Philosophy

This package is designed to be **framework-agnostic**. It contains:

- ✅ Pure TypeScript types and interfaces
- ✅ Core logic and utilities
- ✅ Validation schemas
- ❌ NO React components
- ❌ NO UI rendering logic
- ❌ NO framework dependencies

This allows the core types and logic to be used in:
- Build tools and CLI utilities
- Backend validation
- Code generators
- Alternative framework adapters (Vue, Svelte, etc.)

## API Reference

See [full documentation](https://objectui.org/docs/api) for detailed API reference.

## Links

- 📚 [Documentation](https://www.objectui.org/docs/guide/architecture)
- 📦 [npm package](https://www.npmjs.com/package/@object-ui/core)
- 📝 [Changelog](./CHANGELOG.md)
- 🐛 [Report an issue](https://github.com/objectstack-ai/objectui/issues)
- 🤝 [Contributing Guide](https://github.com/objectstack-ai/objectui/blob/main/CONTRIBUTING.md)
- 🗺️ [Roadmap](https://github.com/objectstack-ai/objectui/blob/main/ROADMAP.md)

## License

MIT — see [LICENSE](./LICENSE).
