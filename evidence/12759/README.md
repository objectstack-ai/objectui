# objectui#12759 live reading

Backend: `e2e/live/ci/start-backend.sh` (published `@objectstack/*@18.0.0-next.2`, showcase app), port 4759.
Console: this branch's `apps/console` on Vite, port 5759. Browser: Chromium, `timezoneId: Asia/Taipei`, `en-US`.
Record: `showcase_field_zoo` "Specimen — Full", `f_datetime` reset to `2026-06-17T14:30:00.000Z` (22:30 in Taipei) before each run.
Each run double-clicks the Date / Time value on the record page, edits it inline, saves, and reads the record back from `GET /api/v1/data/showcase_field_zoo/ID`.

| Run | Editor | Edit | PATCH body | Stored after |
|---|---|---|---|---|
| before (`origin/main` editor) | native date input | day set to 2026-06-20 | `{"f_datetime":"2026-06-19T16:00:00.000Z"}` | `2026-06-19T16:00:00.000Z` (local midnight; 22:30 lost; box repaints 06/19) |
| after, calendar | platform picker `06/17/2026, 10:30 PM` | calendar day 20 | `{"f_datetime":"2026-06-20T14:30:00.000Z"}` | `2026-06-20T14:30:00.000Z` |
| after, typed + Save | platform picker | typed `06/20/2026, 09:05 PM` | `{"f_datetime":"2026-06-20T13:05:00.000Z"}` | `2026-06-20T13:05:00.000Z` |
| after, typed + Ctrl+Enter | platform picker | typed `06/20/2026, 09:05 PM` | `{"f_datetime":"2026-06-20T13:05:00.000Z"}` | `2026-06-20T13:05:00.000Z` |
| control, `date` field (after) | platform picker `06/17/2026` | calendar day 20 | `{"f_date":"2026-06-20"}` | plain day |
