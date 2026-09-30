---
'@object-ui/app-shell': patch
---

fix(app-shell,i18n): the designer's flow, federated-panel and field-stub chrome speak the user's language (objectui#10862, slice 4)

Under zh-CN these designer surfaces rendered their own words in English beside
Chinese text:

- the federated datasource panel's tables tab: the filter box, refresh button,
  loading, empty and no-match notes, table headers, import buttons and the
  federation-unavailable message;
- its validation tab: the intro, run button, match and divergence summaries,
  per-object diff counts, the ten diff-kind badges, the expected / actual line
  and its federation-unavailable message;
- the import dialog: its title, intro, draft progress, object name, review
  count, generated-source heading, import / cancel / close buttons, the
  imported confirmation and the federation-unavailable message;
- the flow canvas: an edge's hover title for an un-declared cycle and for a
  back-edge, and a node card's branch count, approver count and `code` summary;
- the flow preview's variable `in` / `out` tags, and an expanded run's
  `run …` / `trigger …` line in the run history;
- the address field stub's placeholder in the form designer;
- the "not found" reason the view, report and dashboard widget inspectors
  show when the bound object or dataset is missing.

Each new en row is the English the literal carried, so en renders unchanged.
Remote table, column and object names, a diff's expected and actual values, a
draft's review notes and generated source, node ids, run ids and trigger types,
and a server's own error message show as written in every locale.

This is slice 4 of objectui#10862.
