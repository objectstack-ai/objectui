---
---

Comment-only repair in `@object-ui/core`'s `dataset-format.ts` — **no behaviour change**, so
nothing to release.

`formatMeasureDate`'s inline note and the `ISO_DATETIME_RE` docblock both asserted that a
well-shaped impossible calendar date such as `2026-02-30` is unparseable and therefore "keeps
falling through to `String(v)`". Measurement on objectui#8263 showed the opposite on **both**
arms: ECMAScript's Date Time String Format accepts `DD` in `01`-`31` syntactically and `MakeDay`
rolls the surplus into the next month, so `Date.parse` returns an instant, not `NaN`. What the
guard actually rejects is an out-of-range **month** (`2026-13-01`), which the two patterns admit.

Both sentences now say that. The rolled render itself is untouched and stays pinned by
`agrees with the list cell on a rolled-over date instead of second-guessing it` in the co-located
date suite, which the new prose points at rather than restates. Whether the shared display path
should refuse an impossible calendar day at all is carried by objectui#10026.
