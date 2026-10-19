---
'@object-ui/plugin-charts': patch
---

An object chart reads its object's metadata through the data source, so the charts of one dashboard ask for one object's metadata once (objectui#13039).

The chart's category colours and dimension labels come from the bound object's field options. It read them with its own request to `/api/v1/meta/object/NAME`, outside the data source's metadata cache, so every chart over one object sent one more request for the same document. The chart now reads it through the data source's `getObjectSchema` when one is in scope: the read that its own group-by labels, the metric tile and the data table already use, and that the ObjectStack adapter joins while it is in flight. With no data source, or one that cannot answer `getObjectSchema`, the chart reads the document directly as before.

Colours, labels and dotted dimension paths resolve as they did. Nothing is added to the package entry.
