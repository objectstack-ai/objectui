---
'@object-ui/components': patch
---

`element:repeater` and `element:record_picker` re-read their rows when the sort they send changes (objectui#10664, folding objectui#10665).

Both blocks put their sort on `$orderby` (the repeater's `properties.sort`; the picker's `properties.sort` or its `dataSource` binding's `sort`), but neither re-ran its read when only the sort changed, so a bound sort control or a live preview kept showing the old order. Each now keys its read on the sort's content, the way it already keys on the filter's, so an equal sort in a new array does not re-read.
