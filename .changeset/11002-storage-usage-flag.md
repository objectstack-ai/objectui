---
'@object-ui/app-shell': minor
---

The console asks `GET /api/v1/usage/storage` only when the runtime serves it (objectui#11002). On a self-hosted or open-source runtime, an environment admin's console used to request that cloud-only endpoint on every shell mount and log a 404 each time. Now neither the storage-capacity banner nor the read-rate report asks unless the runtime config's `features.storageUsage` is `true`. The cloud distribution sends that key exactly when it mounts the endpoint (cloud#2481), and every other runtime sends no key.

**Clause-②: yes (widening)** — the exported `RuntimeFeatures` type gains one optional member, `storageUsage?: boolean`, so `AppShellRuntimeConfig.features` and the value `getRuntimeConfig()` returns carry it too. It is `false` by default and after any runtime-config payload whose `features.storageUsage` is not the literal `true` (absent, `false`, `'true'` and `1` all read as `false`). It is `true` only when the payload sends `true`. As with the other feature keys, a payload with no `features` object leaves the current value. Nothing else on the package entry changes: no export is added or removed, and no existing member changes type.

**Behaviour change.** `ConsoleShell`'s two banners request the endpoint only when the viewer is the environment admin, as before, and `features.storageUsage` is on. Both read the same flag and still share one request. A cloud runtime older than the one that serves the key (cloud#2517) sends no key, so its admins see neither banner until that runtime is upgraded.

Not published: the accessor the banners read, `isStorageUsageServed()`. Like its siblings `isMarketplaceEnabled()` and `isAiStudioEnabled()`, it ships inside `dist/` but is not exported from the package entry. `useStorageUsageReading` and `useReadRateReading` are unchanged and keep their `enabled = true` default.
