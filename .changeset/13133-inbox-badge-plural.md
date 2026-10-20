---
'@object-ui/i18n': patch
'@object-ui/app-shell': patch
---

The inbox header's breakdown line agrees in number: "1 notification" and "1 pending approval", no longer "1 notifications" and "1 pending approvals" (objectui#13133).

`notifications.badgeNotifications` and `notifications.badgeApprovals` were interpolated with named placeholders (`{{unread}}`, `{{approvals}}`), so i18next never chose a plural form and every language pack had one string for every count. The inbox popover now passes `count`, and each of the ten packs carries the plural family its language needs (`_one` / `_other`, plus `_many` in es, fr and pt, `_few` / `_many` in ru, and all six categories in ar), worded as each pack already words `notifications.approvalsPending`. The ja, ko and zh slots repeat one string.

A host that overrides these two keys in its own resources must spell `{{count}}` instead of `{{unread}}` / `{{approvals}}`. No export, prop or type changes.
