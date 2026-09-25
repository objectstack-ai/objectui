---
'@object-ui/components': patch
---

fix(components): spec action entries stop forwarding an object `params` as values on non-`api` types

This finishes ruling A on objectui#10289 for the spec action-entry surfaces: an
action's `params` is only the `ActionParam[]` list of inputs to collect from the
user. `action:button` / `action:icon` already follow it. Now `element:button`'s
inline `action`, `action:group` items, `action:menu` items and `page:header`'s
header actions follow it too (objectui#10462).

- An ARRAY `params` is forwarded to the runner as `actionParams`, the input list.
  `action:group` and `action:menu` used to forward it under `params`. The runner
  read both spellings the same way, so param collection behaves as before.
- An OBJECT `params` on any action type except `api` is no longer forwarded as
  `ActionDef.params` values. A development build logs one warning per action,
  and production is silent. `page:header` still stashes the current record
  under `params._rowRecord`; only the authored object is left out.
- An OBJECT `params` on a `type: 'api'` action is unchanged. The objectstack#5777
  window keeps the runner reading it as the request payload, with its own
  warning naming `bodyExtra`, until 18.

The spec already refuses an object `params` at the authoring door, so only
metadata that skipped validation is affected.
