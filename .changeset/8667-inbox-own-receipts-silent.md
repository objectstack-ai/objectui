---
'@object-ui/app-shell': patch
---

The inbox arrival announcement (the in-page toast, or the desktop notification
in a hidden tab) no longer fires for a message the signed-in user caused
themselves (objectui#8667). Assigning yourself a task, or any flow that lists
its initiator among the recipients, still lands in the inbox and still counts
on the bell badge; it just does not pop.

The inbox feed now maps the `actor_id` column that `sys_inbox_message` carries
since objectstack#16974 onto `InboxNotification.actor_id`. It is a bare
`sys_user` id, because the feed reads that lookup without expanding it. The
arrival filter then skips a new, unread row whose actor is the signed-in user's
id. The skipped row is still remembered as seen, so a later poll does not
announce it either.

Only a concrete id equal to the signed-in user's suppresses. A digest row
carries no actor (`null`), and a server that predates the column sends no
`actor_id` at all; both announce exactly as before.
