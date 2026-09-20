---
---

Internal tooling only — no package source changed, so this changeset declares "no release" rather than requesting one.

`scripts/check-handler-key-read-sites.mjs` now reads a property access through the type-only wrappers that erase at runtime (`as`, `satisfies`, `!`, parentheses), so `(schema as any).onX` is judged exactly as `schema.onX` already was. A cast was never one of the five boundaries that gate declares it does not answer; it was an undeclared hole, and two live `onTabChange` reads sat in it (objectui#9344). Their per-key disposition is not decided here — both are ledgered to objectui#7804, which owns it.
