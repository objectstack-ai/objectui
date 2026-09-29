---
'@object-ui/app-shell': patch
---

A reaction click on a record page's discussion keeps every other user's stored reaction

`sys_comment.reactions` stores `{ emoji: userIds[] }`, and a reaction click
writes the comment's whole reaction set back. The panel used to keep only a
count and an own-mark per emoji, so the write rebuilt each emoji's list from
them: the clicker's id when they had reacted, padded with a literal
`'__other__'` up to the count. The first click by anyone replaced the id of
every other user on every emoji of that comment, and their own reactions
stopped reading as theirs: their next click added a second reaction instead of
taking theirs back.

The read now keeps each emoji's stored ids on the reaction (`Reaction.userIds`),
and a click adds or removes only the clicker's own id in the clicked emoji. An
emoji left with no ids is dropped from the write, the same way the read shows an
emoji the stored map does not carry. Every other id, on every emoji, is written
back as it was read.

Rows an earlier build already wrote keep their `'__other__'` entries: they are
stored data, still counted as someone else's reaction, and never read as the
clicker's. The ids they replaced are not recovered.

Two people reacting at the same moment still means the later write wins.
