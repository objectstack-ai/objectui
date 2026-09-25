---
---

Test-only change in `@object-ui/console`, no package released: the route-table cases of `ApiConsolePage.requestPreset-10591.test.tsx` now wait for the API console's lazy route to leave its loading frames before their existing `findBy*`, instead of spending the default 1000 ms window on the module loader. The standalone `developer/api-console` case failed that window intermittently on a saturated CI shard (objectui#10645). No published behaviour changes.
