---
'@object-ui/i18n': patch
---

All ten language packs gain the panel titles the data-bound blocks now read for an unresolvable `dataSource.view` (objectui#12920): `element.KIND.sourceUnresolved` for `calendar`, `chart`, `pivotTable`, `detailView`, `relatedList`, `form`, `lineItems`, `gantt`, `grid`, `board`, `listView`, `map`, `timeline` and `component`, plus `element.component.noDataSource` for the no-adapter panel and `element.relatedList.parentUnreadable` for `record:related_list`'s failed parent read. No existing key or value changes.

Clause-②: yes

The new keys widen the exported `TranslationKeys`. Nothing narrows.
