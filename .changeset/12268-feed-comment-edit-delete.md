---
'@object-ui/app-shell': minor
'@object-ui/plugin-detail': minor
'@object-ui/collaboration': minor
'@object-ui/react': minor
'@object-ui/types': minor
'@object-ui/core': minor
'@object-ui/i18n': minor
---

The author of a comment on a record page can now edit and delete it from the record feed (objectui#12268).

`sys_comment` declares the generic Edit and Delete affordances (`managedBy: 'platform'`), and the platform lets an author update and delete their own comment, but the record feed only offered reactions and replies. Now the author's own comment and reply show Edit and Delete. Nobody else sees either control on it.

- **Edit** opens the comment's text in place. Save stores the new text and marks the comment edited; the row then shows the new text with the usual "(edited)" mark. If the server refuses, an error appears, the editor keeps the draft, and the comment keeps its previous text. A comment stored as edited reads as edited.
- **Delete** asks first, through the console's usual destructive confirm dialog. Cancel deletes nothing. If the server refuses, an error appears and the comment stays.
- **Replies outlive their comment on screen.** A reply whose comment the feed does not hold, because that comment was deleted or lies before the loaded page, now shows as a row of its own instead of disappearing, so deleting a comment no longer hides anyone's replies to it.
- Each control appears only with the matching permission on `sys_comment` (update for Edit, delete for Delete). The server's own rule still decides every write.

Published surface, all additive:

- `@object-ui/collaboration`: new export `isCommentAuthor(authorId, viewerId)`, the owner rule `CommentThread` gates Edit and Delete on. Two missing or empty ids no longer count as a match.
- `@object-ui/types`: `FeedItem.authoredByViewer?: boolean`, set by the host that read the row.
- `@object-ui/react`: `DiscussionContextValue.onEditComment` and `onDeleteComment`.
- `@object-ui/plugin-detail`: `onEditComment` and `onDeleteComment` on `RecordActivityTimelineProps`, `RecordChatterPanelProps` and `ThreadedRepliesProps`. A reply now shows the "(edited)" mark too.
- `@object-ui/core`: two rows in the affordance-to-grant map, `feedCommentEdit` and `feedCommentDelete`.
- `@object-ui/i18n`: five new `detail.*` keys in all ten language packs (`editComment`, `deleteComment`, `deleteCommentConfirm`, `commentEditFailed`, `commentDeleteFailed`).
