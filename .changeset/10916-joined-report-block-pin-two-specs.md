---
---

Rewrite the `JoinedReportBlock` pin in `report-chart-query-spec-parity.test.ts`
(objectui#10916) so it compiles against both the installed `@objectstack/spec`
17.4.0, which still erases the block type to `unknown`, and spec `main`, which
objectstack#20369 typed. A test-time tripwire now fails at the first spec bump
past 17.4.0, which is when the burn-down it records becomes possible. Test and
ledger text only; no package is released by this change.
