---
'@object-ui/auth': minor
'@object-ui/plugin-grid': minor
'@object-ui/plugin-list': minor
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

On a cloud-managed environment (`features.cloudManaged: true` from `/auth/config`), the console says what the server already enforces. Setup → Users shows one line saying where people are invited (the organization, in the cloud) and marks a user who holds no permission set beyond the baseline as "Not authorized", read from their `sys_user_permission_set` and `sys_user_position` rows. The identity import entry is not offered, the organization members page shows a note instead of Invite member, and the recovery-password reminder does not show. With the flag absent or `false`, nothing changes.

`AuthPublicConfig['features']` gains `cloudManaged`. `ObjectGrid` gains the `rowAdornment` host prop, a node drawn beside one row's title (the declared name field's cell, else the first shown column, and the card title in the card view), and `ListView` forwards its own `rowAdornment` to the grid.

Clause-②: yes
Metadata-protocol: none
