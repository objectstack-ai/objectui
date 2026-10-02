---
'@object-ui/app-shell': patch
---

`AiUsageIndicator` renders the reset line for the rolling 5-hour pace window,
`resetKind: 'fiveHour'` (objectui#11415, consumer of cloud#2059 / cloud#2574).

Before this change a `fiveHour` pool fell through to the component's
unrecognized-kind path and rendered no reset line, so a user stopped by the
5-hour pace saw nothing telling them when they could continue. The popover now
reads "Resets in N hours", counted down from the endpoint's `resetsAt` exactly
as the weekly arm's final day is: rounded up and never below one, so a reset
under an hour away reads "1 hour", never "0 hours". It reuses the existing
`console.ai.usage.resetsWeeklyHours` plural family, whose copy names no window
in any of the ten locale packs, so no locale pack changes.

Contract-first: `resetsAt` is the one source of the reset instant and is never
re-derived client-side. A `fiveHour` pool with `resetsAt: null` (nothing counted
in the window yet) renders no line, and any `resetKind` this build does not
recognize still renders none (objectui#7371). `AiUsageResetKind` gains the
`'fiveHour'` member; `daily` and `monthly` stay, since control planes before
cloud#2574 still emit them.
