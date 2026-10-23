---
'@object-ui/app-shell': patch
---

Setup → Positions: a new position is created together with its permission sets, Save is labelled, Remove holder asks first, and the holder picker offers organization members only (objectui#13337).

- New Position shows the Permission Sets picker beside the label, name and description, so binding a set no longer takes a first save and a second edit.
- The metadata editor's Save draws the word "Save" beside its icon. Its accessible name and tooltip are unchanged: the shortcut hint, or why Save is withheld.
- Removing a position holder opens a confirm that names the person; nothing is sent until it is confirmed.
- Add holder reads the active organization's `sys_member` rows when it opens and offers only the users they name, so a user removed from the organization is no longer offered (the server already refuses such an assignment). With no active organization, or no `sys_member` object registered, the picker lists every user it may read, as before.
