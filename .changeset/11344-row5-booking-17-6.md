---
---

Test-only change in `@object-ui/core`; no published behaviour changes. Under objectui#11438 ruling A″, row 5 of the `@objectstack/spec` 17.6.0 bump, `ActionSchema.outcomeMessages`, is booked as owed to objectui#11344 in `actionKeys.pin.test.ts`, with an expiry (2026-11-02, or when objectui#11344's slice lands, whichever is first). The file's spec-inventory row now requires its `missing` set to equal that one-entry ledger exactly, and a new row asserts today's difference: the spec declares the key, and neither `SPEC_ACTION_KEYS` nor `KNOWN_ACTION_KEYS` knows it. The file sits under `packages/core/src/actions/__tests__/`, which the package's `tsconfig.json` excludes from the build program, so the published `dist` does not carry it.
