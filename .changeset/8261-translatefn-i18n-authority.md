---
'@object-ui/i18n': minor
'@object-ui/app-shell': patch
'@object-ui/fields': patch
---

`@object-ui/i18n` now publishes `TranslateFn` — i18next's `t` narrowed to
`(key: string, options?: Record<string, unknown>) => string` — as the one
authority for that name (objectui#8261, on the maintainer's ruling on
objectui#8165, option A):

```ts
import type { TranslateFn } from '@object-ui/i18n';
```

`@object-ui/app-shell` (`writeWarningToast`, which its sibling toast modules
re-export) and
`@object-ui/fields` (`file-size-guard`) each declared their own copy of this
type. Both copies were byte-identical to the new declaration, and both modules
now re-export it from `@object-ui/i18n` instead of declaring it, so every
existing import of `TranslateFn` from those modules resolves to the same type
it did before — no call site's contract moves. Neither package publishes the
name from its own entry; `@object-ui/i18n` is the one place to import it from.

The `TranslateFn` entry in the one-authority gate's `KNOWN_COLLISIONS` baseline
(`scripts/__tests__/one-authority-per-exported-name-6273.test.ts`) is removed:
the name now has one declaration.
