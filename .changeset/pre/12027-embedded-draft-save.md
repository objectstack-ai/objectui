---
'@object-ui/app-shell': patch
---

The embedded item editor ("Save into object", opened from a metadata item's Related drawer) now saves into the parent's draft (objectui#12027).

It saves an item such as `object.fields.amount` by writing the whole parent back. It used to base that write on the parent's published version and send it in publish mode. For a parent that exists only as a draft, there is no published version: the layered read answers 404 by design, and the client reads that as every layer empty. So the save sent a publish-mode write of a one-field stub, without the draft's name, label or other fields, and then showed "Saved.".

- **A parent with a pending draft:** the save reads that draft, splices the item into it, and writes it back as a draft (`mode=draft`). Every other field the draft holds is kept, and nothing is written live. This covers a draft-only parent and a published parent whose draft has moved on.
- **A published parent with no draft:** the save reads the published body and writes it as before.
- **A parent with neither:** the save is refused with an error ("Failed to load TYPE/NAME: (not found)"), and nothing is sent.
- A failed draft read is the save's error, and nothing is sent. A refused draft save still marks the sub-form field its issues name.

Nothing is added to the package entry: no export, prop, type member or language-pack key. The refusal reuses existing strings from the metadata-admin designer's own table.
