---
---

Docs + test only, no published behaviour change.

`content/docs/plugins/plugin-calendar.mdx` claimed `ObjectCalendar` reads exactly
the spec's four `CalendarConfig` keys and that a fifth is rejected. Re-derived
from the renderer: it reads five — the four plus objectui's own `allDayField`,
load-bearing since objectui#8026 — and neither objectui authoring face rejects a
fifth key in the `calendar` block. The page now separates the spec face from the
renderer face, and `packages/types/src/__tests__/calendar-doc-key-set-8830.test.ts`
derives both sets on every run so the enumeration cannot drift again.
