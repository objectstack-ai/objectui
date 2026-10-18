---
'@object-ui/app-shell': minor
'@object-ui/i18n': minor
---

Home: "Recently accessed" brings you back to the records and list views you opened, beside the activity feed (objectui#12604).

- **List views are remembered.** Opening a named list view (`/apps/APP/OBJECT/view/VIEW`) records that view, so it comes back as its own entry, labelled with the view's name in your language. The recent-items store keeps the last 20 entries instead of 8, one per record and one per list view. Home shows the newest six, and the sidebar's Recent group shows five, as before. Opening a record, or its create or edit form, no longer also adds the object's list to the store. The record page already records the record itself.
- **Each row says where it came from.** A row shows a kind icon (a record shows its object's icon), the title, and a trail such as "Account · HotCRM · 10 minutes ago": the record's object, or the kind of entry, then the app it was opened in and when. The time uses your display locale.
- **New layout.** "Recently accessed" and "Activity feed" each have a heading above a bordered card, with 40 px rows in the recent list. Each activity row shows the actor, the change, and a line with the time and the object. The activity column still appears only when you may read `sys_activity`. Without it, the recent list spans the full width.

`RecentItemType`, exported from `@object-ui/app-shell`, gains the `'view'` member. A `view` entry carries `object` and `name` (the view's name) rather than a `label`. Code that switches over every kind must handle it. Each language pack gains `home.recentApps.itemType.view`.
