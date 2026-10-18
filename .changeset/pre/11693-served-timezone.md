---
'@object-ui/core': minor
'@object-ui/i18n': minor
'@object-ui/console': minor
---

Dates and times render in the time zone the server answers for the signed-in workspace (objectui#11693).

`GET /api/v1/auth/me/localization` answers `timezone` beside `currency` and `locale`, and the console kept only the other two. It now carries all three, and every date and datetime face built on the shared date-display functions of `@object-ui/core` (field cells, grid and card dates, gantt tooltips, dataset measures, data-table cells) renders an instant in that zone. A date-only value still names the day it stores, whatever the zone. With no zone, every face renders in the viewer's own zone, as before.

The zone is whatever the endpoint answers. A server that answers a zone for a workspace that configured none (objectstack's localization cascade answers `UTC` in that case) moves that workspace's datetimes into that zone.

- **`@object-ui/core`**: `setDisplayTimeZone(timeZone)`, `getDisplayTimeZone()` and `subscribeDisplayTimeZone(listener)` declare and read the zone the date faces render instants in. An IANA name the runtime's `Intl` does not know clears it, with a console warning, instead of making every face throw.
- **`@object-ui/i18n`**: `LocalizationValue` gains `timezone`. `LocalizationProvider` hands it to the date faces, and `useLocalization().timezone` reads back the zone they render in.
- Renderers that format dates with their own `Intl` options rather than through the shared functions do not take the zone yet.
