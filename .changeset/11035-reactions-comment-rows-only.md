---
'@object-ui/plugin-detail': patch
'@object-ui/app-shell': patch
---

The Add reaction button renders only on a comment row of a record's discussion feed

A reaction is stored on the comment (`sys_comment.reactions`). The same feed
also shows activity rows read from `sys_activity`, such as a field change, a
completed task or a system event, and `RecordActivityTimeline` rendered the Add
reaction button on those rows too. Picking an emoji on an activity row handed
the host the activity's id, and the record page sent a `sys_comment` update
keyed by that activity id.

`RecordActivityTimeline` now offers reactions only on a `comment` row, the one
feed kind built from `sys_comment` rows. Any other row renders no Add reaction
button, and reactions a host hands on such a row show as chips that cannot be
clicked. A comment row keeps its Add reaction button and its clickable chips.

The record page's reaction handler (`RecordDetailView` in app-shell) also
refuses an id whose feed row is not a comment, without writing anything.
