---
"@object-ui/types": minor
---

`InputShorthandSchema` and `UiCalendarSchema` are now named exports of `@object-ui/types`
itself, not only of `@object-ui/types/form` and `@object-ui/types/zod` (objectui#9406).

Before this release, `import type { UiCalendarSchema } from '@object-ui/types'` read
`TS2724` while `CalendarSchema` — its neighbour on the very same re-export list — resolved
in the same compilation pass. The failure was not merely "the name is not there": the
compiler answered with a suggestion naming a DIFFERENT component (`CalendarSchema` for
`UiCalendarSchema`, `InputOTPSchema` for `InputShorthandSchema`), and `ui:calendar` and
`calendar` resolve to different renderers. An author who takes the suggestion writes an
import that compiles and means something else, which is worse than one that fails.

The change is purely additive — two names join the root barrel's existing named re-export
list from `./form.js`, nothing is removed, renamed or narrowed, and both subpaths keep
working. Both names were already published on two other entry points of this same package,
so this aligns the third rather than widening the surface; it is the route objectui#7697
took for `ComboboxOption`, on the same list, for the same shape.

`form-barrel-mirror-9406.test.ts` keeps it closed, and it is DERIVED rather than a pair of
presence assertions: it reads `form.ts`'s export list and the root barrel's `./form.js`
re-export list on every run and names whatever is in the first and not the second. A pin
asserting "these two names are present" would pass on the day the next declaration lands in
`form.ts` and is forgotten, which is this class reopening a third time. Names deliberately
left off the list get a ledger row carrying the reason instead, and a row goes red once its
name reaches the barrel or stops being declared.

Running that pin against this list surfaced two more names in the same state,
`CommandItem` and `CommandGroup` — the element types of `CommandSchema.groups` and of its
`items`, reachable only through the `/form` subpath while `CommandSchema` sits on the root
list. objectui#9406's ruling authorises exactly two names, so they are ledgered as
undecided rather than moved, and reported for their own card.
