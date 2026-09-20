---
---

Test-only change: `object-form`'s four remaining registry inputs — `customFields`,
`dataSource`, `mobile` and `sections` — become per-block member pins, and their
`MEMBER_PIN_EXEMPTIONS` entries are deleted in the same change with
`MEMBER_PIN_EXEMPTION_CEILING` following down to match the new count. No published
behaviour changes and no published byte moves: every file this change touches is a
`*.test.tsx`, which neither package's build emits.

Measured rather than assumed, on the corpus each package's `package.json`
`files[]` actually ships, after building both. In `@object-ui/plugin-form`'s
`dist` the three new test-file basenames and the shared describe-string fragment read zero
while `ObjectForm`, `mobileStickyActions` and `stepperFieldsPerStep` all read
non-zero in the same scan; in `@object-ui/console`'s `dist` the symbols unique to
the edited ledger (`MEMBER_PINS`, `MEMBER_PIN_EXEMPTIONS`,
`MEMBER_PIN_EXEMPTION_CEILING`, `AWAITING_A_PIN`) read zero while the corpus itself
answers to its lit controls.

Refs objectui#8071, objectui#8068.
