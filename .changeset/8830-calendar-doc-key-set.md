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

**Correction, 2026-10-01 (objectui#8831).** "the four plus objectui's own `allDayField`" is false against `@objectstack/spec` 17.5.0, which this same release installs. That release's `CalendarConfigSchema` declares all five, so `allDayField` is a spec key like the other four. objectui#11073's bump made the phrase false, not this entry and not objectui#8831. The rest of this entry holds: the renderer still reads five keys, neither objectui face rejects an extra key in the `calendar` block, and `calendar-doc-key-set-8830.test.ts` still derives both sets on every run.
