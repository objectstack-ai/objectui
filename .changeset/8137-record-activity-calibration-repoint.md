---
---

Re-point the `record:activity.types` member calibration control in
`registry-inputs-spec-parity` from `'Account'` to `''`.
`@objectstack/spec` 17.3.0 made that vocabulary open —
`z.array(z.union([FeedItemType, z.string().min(1)]))`, objectstack `1a6a19c31`
executing the maintainer's 2026-08-24 ruling — so the old
probe now accepts, while `''` is still refused for its CONTENT via `.min(1)`.
Test only; no package is released by this change.
