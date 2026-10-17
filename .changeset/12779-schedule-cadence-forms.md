---
'@object-ui/app-shell': patch
---

Clause-②: no

The flow designer's **Cron schedule** field on a start node reads every cadence form the engine runs, instead of reading empty over a schedule that runs (objectui#12779).

The field read only `config.schedule.expression` or the legacy flat `config.cron`. It now reads `config.schedule` the way the engine's schedule trigger resolves it (`normalizeSchedule` in `@objectstack/trigger-schedule`):

- **A cron, in any spelling, shows as its cron:** a bare string such as `schedule: '0 8 * * *'`, `{ expression }` and `{ cron }`, with `type: 'cron'` or untyped.
- **An interval or once cadence shows as what it is, read-only:** for example "Every 1 min" for `{ type: 'interval', intervalMs: 60000 }`, or "Once, at …" for `{ at }`. A line under it says the designer edits cron schedules only. No cron edit is offered over it, and the stored cadence is kept as it is.
- **Typing a cron stores a schedule the engine resolves to that cron.** A bare string stays a bare string. A stale `cron` key is replaced rather than left beside a new `expression`. A typed cron keeps its `type` and `timezone`. A legacy flat `config.cron` still moves into `config.schedule` on the first edit.

Nothing else changes: no spec key, prop or export is added, and the canvas's node summary is untouched.
