---
'@object-ui/types': minor
---

**BREAKING** — `UIEventHandler` and `EventableSchema` are RETIRED from
`@object-ui/types`, and `APISchema` loses its `EventableSchema` arm
(objectui#6497, ADR-0049 enforce-or-remove).

**ADR-0049 disposition: remove.** Ruled on objectui#6497 (director seat,
2026-09-24, maintainer 「同意」), the re-priced option 2 of the three the card
offered, under the startup-stage rule: no deprecation window. `Clause-②: yes` —
two names leave the published surface. Marked `minor`, not `major`, per the
version-alignment convention in AGENTS.md; the break is real and is stated here.

What left:

- `UIEventHandler`, the event-handler object: `event`, a `type`, one config
  member per type (`action`, `api`, `script`, `navigate`, `dialog`, `toast`),
  then `condition`, `preventDefault`, `stopPropagation`, `debounce` and
  `throttle`. Its `dialog.actions[]` entries carried a `handler` member typed as
  a nested `UIEventHandler`; nothing read it, and it went with the type.
- `EventableSchema`: `BaseSchema` plus an `events` array of `UIEventHandler` and
  nine `on*` keys (`onClick`, `onChange`, `onSubmit`, `onFocus`, `onBlur`,
  `onMouseEnter`, `onMouseLeave`, `onKeyDown`, `onKeyUp`), each typed
  `UIEventHandler | string`.
- The `EventableSchema` arm of `APISchema`, which is now
  `DataFetchableSchema | ExpressionNodeSchema`.

**FROM** `import type { UIEventHandler, EventableSchema } from '@object-ui/types'`
**TO** the supported form: an action is the declarative `ActionDef` object
(`import type { ActionDef } from '@object-ui/core'`) that `ActionRunner`
executes, and a control that runs something is the `action:button` node type.
There is no replacement type in `@object-ui/types`, no alias, and no handler key
on ordinary nodes. objectui#6182 (ruled A) already settled that an authored
handler EXPRESSION string is not a supported authoring form.

```ts
// before — compiled, and no runtime ever dispatched it
import type { EventableSchema } from '@object-ui/types';
const node: EventableSchema = { type: 'button', onClick: { event: 'click', type: 'navigation', navigate: { to: '/users/ada' } } };

// after — that import is a compile error naming the symbol; author the action as data
import type { ActionDef } from '@object-ui/core';
const open: ActionDef = { type: 'url', target: '/users/ada' };
```

**Nothing that worked stops working, because nothing ran it.** Both types were
an island: no component schema extended `EventableSchema`, neither type had a zod
mirror (so `objectui validate` never judged the dialect), and nothing in this
repository outside the declaring module and the barrel read either name or
`APISchema`. Only `tsc` said yes, which invited authors to write a handler
dialect that no runtime dispatches.

⚠️ **That zero is the in-repo half.** This repository's tracked files were
searched, with a lit control in the same pass. Customer applications that import
either name are not visible from here; they get the compile error above.

The tombstones are the comment standing where the two interfaces were in
`api-types.ts` and the comment standing where the barrel re-exports were in
`index.ts`. The executable half, including the tree-wide search with its control,
is `packages/types/src/__tests__/eventable-schema-retired-6497.test.ts`.
