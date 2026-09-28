---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

Fix the ChatDock AI usage indicator going blank against the single-pool AI usage
endpoint (objectui#8524).

The cloud `GET /api/v1/ai/usage` endpoint now answers `{ pool, breakdown }`: one quota
pool, plus `breakdown`, a read-only split of that same pool into app-building (`build`)
and data Q&A (`dataChat`). `useAiUsage` only read the retired per-meter
`{ meters: { build, dataChat } }` answer, so it returned `null` and `AiUsageIndicator`
rendered nothing, with no error.

- `useAiUsage` reads `{ pool, breakdown? }` and only that shape. A missing `breakdown`,
  or one whose members are `null`, is a normal reading. Any other answer — the retired
  `{ meters }` one included — leaves `usage` `null` and now also sets `error`.
- The hook's `AiUsageResponse` type is now `{ pool, breakdown? }`, with the new
  `AiUsageBreakdown` type for the split; `AiMeterUsage` keeps its fields and describes
  the pool.
- `AiUsageIndicator` draws one ring from `pool`. When a `breakdown` member is a number,
  the popover lists it under the pool's row as a percentage of the pool, as text and
  never as a second ring. The upgrade / top-up button's test id is now `ai-usage-cta`
  (it was `ai-usage-cta-build` / `ai-usage-cta-dataChat`).
- New locale key `console.ai.usage.breakdownTitle` ("Used so far") in every locale pack.
