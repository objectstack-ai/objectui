---
'@object-ui/plugin-grid': patch
---

The internal ledger behind `ObjectGrid`'s relational copy set drops its `allow_create`, `lookup_columns` and `lookup_page_size` rows, because `LookupField` no longer reads those spellings (objectui#12157). The copy set itself does not change.
