---
'@object-ui/core': minor
'@object-ui/app-shell': patch
'@object-ui/plugin-detail': patch
---

The record feed and a related list's Add existing and fallback remove read the
affordance-to-grant map, so a caller without the grant is no longer offered a
write the server then refuses (objectui#12082, leg B of the write-census
backlog).

- **Four rows join `AFFORDANCE_GRANTS`** (`@object-ui/core`, a published value,
  hence `minor`), each asked of the object the write goes to: `feedComment` (the
  create grant on `sys_comment`), `feedReactionAdd` and `feedReactionRemove`
  (the create and delete grants on `sys_comment_reaction`, the caller's own
  reaction row) and `feedReactionColumn` (the update grant on `sys_comment`,
  for a deployment that stores reactions in a column).
- **The record feed** (`@object-ui/app-shell`'s record page) hands its comment
  composer, its reply input and its reaction control their handlers only where
  the row allows the write; the panel draws each from its handler, so a closed
  row withholds it. The platform's `everyone` baseline grants neither object;
  an application does, so a member whose sets do not was offered a composer
  whose post the server refused. On the reaction store, taking a reaction back
  asks the delete grant: without it the click writes nothing.
- **A related list's Add existing** (`@object-ui/plugin-detail`) reads the row
  of the write it ends in: with a `linkField`, a link row of the list's own
  object (`relatedNew`, the create grant there); without one, a re-parent of the
  picked record (`relatedRowEdit`, the update grant on `add.picker.object`). A
  closed row withholds the button and its dialog.
- **The `record:related_list` fallback remove** (an `add` config with no host
  delete) reads the list object's `relatedRowDelete` row with the object's
  registered schema. On a record page the host withholds its delete exactly when
  that row is closed, and the fallback used to put the delete back.

With no permission provider mounted every one of these reads open, as before.
