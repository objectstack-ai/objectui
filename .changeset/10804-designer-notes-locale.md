---
'@object-ui/app-shell': patch
---

fix(app-shell): the flow designer's expression notes and the dashboard add-widget picker read the designer locale (objectui#10804, objectui#10805)

Under zh-CN these designer words stayed English beside Chinese headings:

- the unknown-reference note under a repeater cell (`FlowExprIssue`), although
  its row had a zh translation and the sibling edge and config-field notes
  already passed their locale;
- the Problems panel's expression messages — a brace or bracket error on a CEL
  slot and on a screen field's `visibleWhen` — which read English where the
  inline cell read the same message in Chinese; a row with no label of its own
  is now prefixed by the column label the inspector shows;
- the `Screen fields` heading of a screen `visibleWhen` picker, and that cell's
  note naming a root that is not a field on the screen;
- the add-widget picker's search box, empty text, category headings and type
  names.

Each new en row is the English the literal carried, so en renders unchanged.
A new widget's default `New TYPE` title is stored author data and keeps writing
the English name in every locale; the stored `type` does not move. The parse and
shape refusals shown for a screen `visibleWhen` are `@objectstack/formula`'s and
`@objectstack/spec`'s own words and still pass through as they are.
