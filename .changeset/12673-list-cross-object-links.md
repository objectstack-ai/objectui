---
'@object-ui/app-shell': patch
---

Console lists link names that point at another object's record, the way the record page does (objectui#12673).

In an object list, a lookup value (an opportunity's account) and a record-pointer value (the record an approval request is about) showed the target record's name but could not be opened: the list page built record links for the listed object only. The list page now builds them with the record page's own builder, so these names link to `/apps/APP/OBJECT/record/ID` in the current app. A plain click opens the record in the console; ⌘-click, Ctrl-click or a middle click opens it in a new tab, and the copied link carries the console's base path.

- A click elsewhere on the row still opens the row's own record.
- A target the viewer cannot read, or that no longer exists, keeps its "record unavailable" face and draws no link.
- An object this console has no route to stays plain text.
- The record page's links, including their way back to the parent record, are unchanged. A list page has no parent record, so links opened from a list carry no way-back entry.
