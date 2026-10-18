---
'@object-ui/app-shell': patch
'@object-ui/plugin-detail': patch
---

The record page's discussion shows stored replies under their comment, and every comment offers the reply input where the caller may post one (objectui#12144).

With threading on, which the default record page's discussion turns on, the timeline takes every reply out of the top-level list and shows a comment's replies only under a reply count above zero. The record page read each `sys_comment` row with its `parent_id` and never a reply count, so after a reload a stored reply was shown nowhere, and no comment read from the server offered the reply input: the first reply on a comment could not be posted from the page.

- **`@object-ui/app-shell`:** the record page counts each comment's replies in the comments it read (the rows whose `parent_id` names it) and sets the feed item's `replyCount` from that count. `sys_comment` stores no reply count; its object definition says to count `parent_id` children at read time.
- **`@object-ui/plugin-detail`:** `RecordActivityTimeline` offers the reply input on every comment row it is handed `onAddReply` for, including a comment with no replies yet, and on no row that is not a comment, because a reply is stored as a comment under a comment. A comment's reply list still shows only when its `replyCount` is above zero, so whether replies show never depends on whether the caller may post one. On the record page the input still needs the create grant on `sys_comment`, as before.

Nothing is added to either package's entry: no export, prop, type member or language-pack key.
