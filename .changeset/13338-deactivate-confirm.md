---
'@object-ui/app-shell': patch
---

Setup's Permission Sets and Positions lists ask before the Active switch turns an item off, and a toast confirms the change either way (objectui#13338).

Switching a permission set or a position off opens a confirm that names how many users lose the access. The count is read from the server when the confirm opens: for a position, its `sys_user_position` rows; for a permission set, its `sys_user_permission_set` rows and the holders of every position whose definition lists the set, one person counted once, as the set's Assigned Users section counts them. A set bound to the `everyone` position is said to reach every signed-in member. A count that cannot be read is said as such, never as "0 users", and the admin may still go ahead. Cancel leaves the item on. Switching an item on asks nothing.
