---
---

Test-only change: pins the objectui#8725 reachability measurement for a `{ group }` form section reaching `SchemaForm`. No published behaviour, type or API changes.

⚠️ **Dated note, 2026-09-28 — those pins have since been rewritten onto the ruled behaviour — objectui#8725.** The measurement they recorded (a `{ group }` section making `SchemaForm` throw `s.fields is not iterable`) went red when the fix landed, and the same file now pins that `SchemaForm` resolves such a section through `resolveSectionGroupReferences` and still refuses a section with no member source. The rest of this entry is kept as the reading of this change.
