---
'@object-ui/app-shell': patch
---

The Pending changes sheet's field rows lead with the field's label, and no longer list a column the platform injected and hides as a change the author made (objectui#13125).

- **Label first.** When an item row is expanded, each added, changed or removed field row reads its label first and the field's machine name beside it in monospace, the way the item row already reads (objectui#11862). An added or changed field shows the label of its draft definition, and a removed field shows the label of its published one. A field with no label, or with a label equal to its name, reads as its name alone, as before.
- **No `__search` row.** The `/meta` reads serve an object with the platform's columns already stamped on, so a new object's rows used to include the search companion `__search` as if the author had added it. A field is now left out of the rows when every definition of it in the two versions carries both `system: true` and `hidden: true`. That is the rule Studio's Data pillar already applies to keep such columns out of the author's views (objectui#11780). Columns the platform injects without hiding them, such as the audit columns and `owner_id`, are still listed.
- An update whose two versions differ only in such a column now reads, once expanded, "No differences detected" and loses its Update badge, as any unchanged update does.

Nothing is added to the package entry: no export, prop or language-pack key.
