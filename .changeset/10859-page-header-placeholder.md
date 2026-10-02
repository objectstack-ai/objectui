---
'@object-ui/components': minor
---

refactor(components)!: drop `page-header` from the opt-in protocol placeholders (objectui#10859, batch 8 phase 2c)

**BREAKING (authoring):** `PROTOCOL_COMPONENTS` no longer lists `page-header`, so a host that calls `registerPlaceholders()` no longer registers a placeholder under `protocol-placeholder:page-header` or the bare `page-header`. The key was never a protocol page block (the spec's `PageComponentType` member is `page:header`), and `@object-ui/layout` retired its registration in the same release. `page:header` stays in the list.

Migration:

- `{ "type": "page-header", "title": T, "subtitle": S }` → `{ "type": "page:header", "properties": { "title": T, "subtitle": S } }`.

**Clause-②: yes** — a registration leaves the runtime (narrowing), released as `minor` with this banner.
