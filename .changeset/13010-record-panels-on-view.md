---
'@object-ui/app-shell': patch
---

A record page reads its timeline, comments, user list and foot-of-page attachments when they are shown, not on every open (objectui#13010, part 2).

`RecordDetailView` used to send four reads beside the record read on every open: the `sys_activity` timeline (`top=200`), the record's `sys_comment` thread, a `sys_user` list of 50 for comment mentions, and, for an object with `enable.files`, the host's own Attachments panel's `sys_attachment` list (`top=100`). They shared the record read's wave, although nothing on the open drew them on a page whose default tab is not the one holding them. HotCRM's opportunity page keeps `record:activity` in its Activity tab.

- **Timeline, comments and the mention list.** They are read when a `record:discussion`, `record:chatter` or `record:activity` block is on screen. That means at open when the page shows one: the synthesized page's discussion footer, a block outside any tab, or `?tab=` naming the tab that holds one. Otherwise they are read when the tab that holds one is opened. Until then the block shows its existing loading state. Once read, a record keeps its rows as before.
- **The foot-of-page Attachments panel** is the panel the host appends to a page that places no `record:attachments` node. It reads its list once it scrolls into view. Until then it shows its loading state. A `record:attachments` node inside a tab already read only when its tab opened, and still does.
- **Unchanged:** the tab strip's count badges, including the Attachments tab's `sys_attachment` count, still go out at open. What each panel shows once opened is unchanged.

Nothing is added to the package entry: no export, prop or type member.
