---
'@object-ui/plugin-dashboard': patch
'@object-ui/components': patch
'@object-ui/plugin-report': patch
---

fix(plugin-dashboard,components,plugin-report): three more read sites show the day a stored date-only value names, in every zone (objectui#10844)

Each read below parsed a date-only `YYYY-MM-DD` string with the engine's own `Date`
parse, which reads it as UTC midnight. West of UTC that is the evening before, so
each face showed the previous day. Each now reads the value through `toDisplayDate`
(`@object-ui/core`), which rebuilds a date-only string at local midnight of the day it
names. For a real day, a viewer in UTC or east of it sees no change.

- **Dashboard date filter, custom range.** The range calendar highlighted the day
  before each stored bound and could open on the previous month: clicking 15 Sep stored
  `2026-09-15` and then highlighted the 14th. It now highlights and opens on the stored
  days. A bound naming a day its month does not have (`2026-02-30`) no longer rolls
  into March: it selects no day, and a `from` like that opens the calendar on today, as
  an unparseable `from` already did.
- **`date-picker` renderer, an ISO string `value`.** An authored or bound
  `value: '2024-01-15'` was labelled "January 14th, 2024" and selected the 14th. It now
  labels and selects the 15th. Only a date-only string naming a real day is read this
  way: a `Date`, a date-time string and any other string reach date-fns exactly as
  before. So an unparseable string still makes the trigger's `format` throw, as it did
  before, and a date-only string naming a nonexistent day is still rolled forward
  rather than refused, because refusing it would make `format` throw where it rendered
  before.
- **Report cell date face (`formatValue`).** The `yyyy-MM-dd` face `ReportViewer` gives
  an untyped ISO-looking value and an aggregated column read `2026-09-14` for a stored
  `2026-09-15`. It now reads `2026-09-15`. A value naming a nonexistent day now renders
  as the raw stored string, this face's existing answer for an unparseable value,
  instead of a rolled-forward day.

A date-time value (one with a time part) still renders in the viewer's zone at every
site.
