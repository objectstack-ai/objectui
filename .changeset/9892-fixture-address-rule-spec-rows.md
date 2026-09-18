---
---

Declare the `no-line-address-in-test-name` RuleTester spec's own addresses as
`fixture-address:` fixture data, so the cross-file citation census stops
reporting them as rot (objectui#9892, objectui#9865).

Every declared row is RuleTester input, or the expected message data that has to
echo that input, so the rule under test is what reads the token and no reader
ever follows it. ⛔ No address moves — these are annotations, not repairs. How
many rows the declarations cover, and the reason each gives, is what
`pnpm census:cross-file-line-citations` prints; per AGENTS.md #9 that answer is
⛔ not copied here.

Repo tooling only; no published package source changed, so no package is
released by this change.
