---
'@object-ui/core': minor
'@object-ui/components': patch
'@object-ui/plugin-detail': patch
'@object-ui/app-shell': patch
'@object-ui/fields': patch
---

A date-only value now renders the calendar day it names, west of UTC, at four more places (objectui#10183).

**Clause-②: yes** — `@object-ui/core` gains one export, `toDisplayDate(value)`: the parse step every date formatter in `utils/date-display.ts` already went through, now reachable by a caller that formats with its own `Intl` options or compares a value with today. Nothing else is added, removed, renamed or retyped, and `@object-ui/fields` does not re-export it.

**What it was.** objectui#10110 repaired the shared date path: a date-only value such as `2026-08-01` is UTC midnight to the JavaScript engine, so reading it back in the viewer's zone lost a day west of UTC. The repair rebuilt such a value at local midnight inside the shared formatters, but four places never reached it. `data-table`'s default cell face parsed the string into a `Date` first, and the shared step leaves a `Date` alone. The record summary chip, the record History tab and the `date` cell's overdue colouring each parsed the value themselves. Measured in `America/Los_Angeles`: `2026-08-01` rendered `Jul 31` in a table cell, `2026年7月31日` on a zh-CN summary chip and `7/31/2026` in History, and a deadline falling today read `Today` in red.

**What changed, in observable terms.**

- A `data-table` cell with no cell renderer hands the string to `formatDate` / `formatDateTime`. This also covers a related list whose child object schema is unavailable, since its cells fall back to that face.
- The summary chip and the History tab take their `Date` from `toDisplayDate`. Their faces are unchanged: the chip keeps `dateStyle: 'medium'`, History keeps the locale's default numeric date.
- The `date` cell's overdue colouring compares the day `toDisplayDate` names, so a deadline falling today is no longer red west of UTC. The cell's text was already right, and its hover title is unchanged.
- ⚠️ The summary chip's and History's `datetime` arms share that parse, so they follow the shared path's rule: the value's shape decides, never the field's type. An instant still converts into the viewer's zone. A date-only value stored on a `datetime` field now reads as local midnight of its day, as `formatDateTime` already rendered it; before, it read as the previous evening west of UTC and as a morning hour east of it.

In UTC every face is byte-identical to before. East of UTC every date face and the overdue colouring are too; only that `datetime`-arm reading of a date-only value moves there.
