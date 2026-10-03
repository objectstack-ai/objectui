---
---

Test-only change in `@object-ui/console`; no published behaviour changes. Under objectui#11438 ruling A″, row 1 of the `@objectstack/spec` 17.6.0 bump, `object-grid.keyboardNavigation`, is booked as owed to objectui#11068 in `registry-inputs-spec-parity.test.ts`, with an expiry (2026-11-02, or when objectui#11068's build lands). The entry joins the file's objectui#11111 ledger, whose `unpublishedKeys` cap rises by exactly this one entry. The GA-block split row admits this one id by name and refuses every other exemption on the four GA blocks as before. The file sits under `apps/console/src/__tests__/`, which nothing outside `__tests__/` imports, so neither the console bundle nor `plugin.*` carries it.
