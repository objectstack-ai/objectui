---
'@object-ui/core': minor
---

feat(core): export `declaredNameField`, the one spelling of the ADR-0079 declared name pointer (objectui#9436)

`declaredNameField(objectDef)` returns the object's declared record-title
pointer exactly as `getRecordDisplayName` reads it at steps 1+2: the canonical
`nameField`, then the deprecated `displayNameField` and `NAME_FIELD_KEY`
aliases. It returns `undefined` when none is declared. It never derives, and
that is the difference from `resolveNameField`, which falls back to the
type-aware derivation.

The function already existed privately in `record-title.ts` and its behaviour
is unchanged. It is exported so that a caller which renders `titleFormat`
itself can rank the declared pointer above the template and the derivation
below it, without re-typing the `??` chain:

```ts
import { declaredNameField, recordDisplayValueAt } from '@object-ui/core';

const declaredTitle = recordDisplayValueAt(record, declaredNameField(objectDef));
```

`PageHeaderRenderer` (`@object-ui/components`), `DetailView` and the
`record:details` H1 dedupe (`@object-ui/plugin-detail`) read it this way in
the same release.
