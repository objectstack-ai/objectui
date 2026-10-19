---
"@object-ui/app-shell": patch
---

A record page of a `trackHistory` object reads its audit history when the History tab is shown (objectui#13010).

`RecordDetailView` read `sys_audit_log` (`top=50`) and the `sys_user` names behind it on every open of such a record, while the History tab was closed. It now reads them when the synthesized page's History tab is on screen: at open when `?tab=history` names it, else when the tab is opened. The tab shows the same rows and its loading state until they arrive. An assigned record page never showed these rows (its `record:history` block reads its own source), so it no longer reads them.
