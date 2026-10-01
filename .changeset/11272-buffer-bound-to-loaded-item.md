---
'@object-ui/app-shell': patch
---

fix(app-shell): a Studio pillar never saves one item's document into another while the second is loading, after a package switch, or after visiting a non-editable leaf

Studio's pillars keep the open item's document in an edit buffer and save it as a draft. Three
paths saved a buffer that was not the open item's. Each was reproduced through the real pillars on a writable package:

- **While the next item was loading**, the pillar went on showing the previous item's document
  under the new one and took edits on it. A save from there wrote the previous item's document into
  the new item. This affected the Interfaces page settings, the Automations enable switch and the
  Data pillar's add field. Until the open item's own document is in, the pillars now show it as
  loading, offer no editor over the previous item's document, and send no save. The enable switch,
  add field, the column reorder, the field count and the "unpublished draft" badge wait for it too.
- **After a package switch**, the Automations and Data pillars kept the previous package's flow or
  object open, and an edit saved it into the new package. Both pillars now start fresh on a package
  switch and open the new package's own items, as the Interfaces pillar already does. An edit made
  less than 1.5 s before the switch is dropped with it.
- **Visiting an object entry in the Interfaces navigation** and then reopening the page just edited
  could send an empty document as that page's draft when the page was slow to reload. Opening such
  an entry now drops the page's unsent edit, and the page's reload is what comes back.
