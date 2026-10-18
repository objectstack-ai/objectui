---
'@object-ui/app-shell': patch
---

Studio flow checker: in a CEL slot (an edge or node `condition`, a decision branch `expression`, a CEL value) the roots the flow engine binds on every run, `previous`, `vars` and `current_user`, are no longer flagged as "not a reference in scope", so a guard such as `has(vars.campaignRecord)` or `vars["$error"] != null` reads clean. `user`, which the engine does not bind in flow CEL, is now reported with `current_user` as the fix instead of passing silently. Template and `{{ }}` text slots are unchanged.
