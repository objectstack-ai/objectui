---
"@object-ui/types": minor
---

`CommandItem` and `CommandGroup` are now named exports of `@object-ui/types` itself, not
only of `@object-ui/types/form` (objectui#9526). They are the element types of
`CommandSchema`: `groups` holds `CommandGroup`, and each group's `items` hold `CommandItem`.

Before this release, `import type { CommandItem } from '@object-ui/types'` read `TS2305`
(and the same for `CommandGroup`), while `CommandSchema`, the schema that contains them,
resolved from the same entry point in the same compilation pass.

The change is purely additive: the two names join the root barrel's existing named
re-export list from `./form.js`, beside `CommandSchema`. Nothing is removed, renamed or
narrowed, the declarations stay in `form.ts`, and the `/form` subpath keeps working. It is
the third instance of one class, repaired by the same route each time: objectui#7697 for
`ComboboxOption`, and objectui#9406 (decision batch #133 item 2, letter (a)) for
`InputShorthandSchema` and `UiCalendarSchema`.

`form-barrel-mirror-9406.test.ts` had found these two names and ledgered them as undecided,
because objectui#9406's ruling covered exactly two other names. Both rows are gone now, and
that pin holds the pair to the barrel list the same way it holds every other name `form.ts`
exports.
