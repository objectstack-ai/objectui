---
'@object-ui/console': minor
---

chore(console)!: drop the lazy `spec-report` stub (objectui#11440)

**BREAKING (authoring):** the console no longer registers a lazy stub for `spec-report` in `register-plugins.ts`. `@object-ui/plugin-report` retired that key. `report` and `report-viewer` stay lazily registered.

Migration:

- `{ "type": "spec-report", "report": { … } }` → `{ "type": "report", "report": { … } }`, with the same `report` member.

**Clause-②: yes**, released as `minor` with this banner.
