---
'@object-ui/types': minor
---

**BREAKING — `PartialSchema<T>` is RETIRED from `@object-ui/types`** (objectui#11608, enforce-or-remove). The utility type leaves the `.` entry, the one entry that published it, with no replacement alias.

**Clause-②: yes (narrowing)**, shipped as `minor` per this repository's version policy: one name leaves the published surface, and the break is stated here.

- **Why.** The alias had no reader: no producer, doc or skill in this repository, and none in the sibling repositories the census could read. While `BaseSchema` carried an index signature it declared `type` alone, whatever `T` was (objectui#6397). objectui#8347 removed that signature, which made the alias work as written and brought its published-export question due. A published capability with no reader is retired, not kept for its sunk cost.
- **objectui#8347's note.** That release note says `PartialSchema<T>` works as written once `BaseSchema` lost its index signature. This removal supersedes it.

**FROM** `import type { PartialSchema } from '@object-ui/types'`, annotating a value as `PartialSchema<T>`.
**TO** the node type's own declared members: annotate a whole node with its node type (`ButtonSchema`, `InputSchema`, …). For a partial value, write `Partial<T> & { type: T['type'] }` inline. It keeps every member `T` declares, with `type` required and the rest optional, and a misspelled key is still refused.

```ts
// before
import type { ButtonSchema, PartialSchema } from '@object-ui/types';
const patch: PartialSchema<ButtonSchema> = { type: 'button', label: 'Save' };

// after: the import above is a compile error naming the symbol
import type { ButtonSchema } from '@object-ui/types';
const patch: Partial<ButtonSchema> & { type: ButtonSchema['type'] } = { type: 'button', label: 'Save' };
```
