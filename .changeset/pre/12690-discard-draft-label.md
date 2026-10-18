---
'@object-ui/app-shell': patch
---

fix(app-shell): "Discard draft" on the metadata editor names the item by its label, not its machine id (objectui#12690)

Clause-②: no

The confirm before a discard and the success toast after it used to name the item as `type/name` (`Draft discarded: object/uxscratch_widget`), even when the item has a label. Both now name the label that the item's loaded body carries (`Draft discarded: QA Widget`), in English and in Chinese. An item with no label still reads `type/name`, and the discard request is unchanged.

The two strings live in the metadata editor's own dictionary, which the package entry does not export. Each now takes one `{item}` placeholder where it took `{type}/{name}`. The runtime draft bar (the view and report config panels) shares the confirm string. It holds no label, so it passes `type/name` as `{item}` and its text is the same as before. No prop, export or language-pack key changes.
