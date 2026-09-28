---
'@object-ui/app-shell': patch
---

fix(app-shell): the object / data previews and the federated datasource panel read the designer locale (objectui#10862, slice 3)

Under zh-CN these designer surfaces rendered their own words in English beside
Chinese text:

- the object, dataset, view, report, page and validation previews: their
  empty states and notes, the dataset preview's run button, counts and
  ratio-axis note, the page preview's sample-record picker, the validation
  rule's pills, section headings and redirect sentences for the removed rule
  types, and the hint beneath every preview's error box;
- the page block canvas: its region and container labels, its empty states (no regions, an empty region, an inherited slot, an empty container group), the add-region and add-block buttons, drop target, rename tooltip, select labels, each block's render-failure hint and the add-block picker's search box, category headings and block names;
- the page source editor's label and error hint;
- the view column manager's heading, empty note, remove controls and
  positional column label;
- the federated datasource panel inside the datasource preview: the save
  prompt, header, write badge, snapshot line, refresh button, tab labels and
  the federation-unavailable message.

Each new en row is the English the literal carried, so en renders unchanged.
Author data (names, labels, messages, tags, rule and block types, region and
slot names, field names, CEL and regex sources), the error a renderer threw and
the name "JSON Schema" show as written in every locale.

This is slice 3 of objectui#10862 (the object / data previews).
