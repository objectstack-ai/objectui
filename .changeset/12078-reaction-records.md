---
'@object-ui/app-shell': patch
---

The record chatter stores each reaction as the member's own `sys_comment_reaction` record, and stops writing the whole `sys_comment.reactions` column (objectui#12078; ruling A, amended, on objectstack-ai/objectstack#22505).

A reaction click used to write the comment's whole reaction set back with one `sys_comment` update. Two members reacting at the same moment therefore left only the later write stored. A member who could read a record but not edit it could not react to another member's comment either, because that update is the comment author's (or a parent editor's) to make.

- **Read.** After the comment read, the chatter reads the comments' reactions in one `sys_comment_reaction` read, `comment_id` `$in` the comment ids, and groups the rows into the reactions the panel already renders. It never reads per comment. A thread of more than 100 comments is read in pages of 100 ids, in parallel, which keeps each request URL near 4.6 KB.
- **Write.** A click creates the member's own reaction row (`comment_id`, `emoji`; the server stamps `user_id`), and a second click deletes that row. Nothing else is written, so another member's reaction can no longer be overwritten, and both of two simultaneous reactions stay. A refused write puts the reaction back and shows the same "Your reaction was not saved" error as before.
- **Reactions stored only in the column are not shown** where the object exists. The maintainer ruled that the column's reactions need no migration.
- **A deployment without `sys_comment_reaction` keeps the column path, unchanged.** This covers a framework that predates objectstack-ai/objectstack#22566, such as cloud's v17 pin. The chatter asks the object registry it already loads. Only an earned "absent" answer keeps the column path; a registry that lists nothing, or has not answered, is not read as absence. The comment read waits until the registry has answered.

Nothing on the package entry changes: no export, prop, type member or language-pack key. `CommentThread` (`@object-ui/collaboration`) and `Reaction` (`@object-ui/types`) are untouched.
