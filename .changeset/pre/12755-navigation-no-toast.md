---
'@object-ui/core': patch
---

Clause-②: no

**A navigation no longer claims a success (objectui#12755).** A `type: 'url'` action, its `navigation` alias and a `type: 'form'` action only change the route, yet each raised the generic success toast ("Action completed successfully" / 「操作已成功完成」) after it navigated, so a button that merely opened a page read as a completed operation. `ActionRunner` now marks such a result `silent` (it keeps `success: true`), so it announces nothing unless the action declares its own `successMessage`, which still shows. Actions that write (api, script, field update, flow) keep their success toast.
