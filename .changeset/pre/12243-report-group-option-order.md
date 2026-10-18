---
'@object-ui/plugin-report': patch
---

fix(plugin-report): a report lays out a select dimension in the field's declared option order (objectui#12243)

A dataset-bound report used to show its groups in the order the dataset returned them, which is the
stored values' alphabetical order. A stage dimension read Closed Won, Needs Analysis, Negotiation,
Proposal, Prospecting, Qualification, and a bar chart beside the table drew the same order.

When the report declares no `order`, the table rows, a matrix's row and column headers and the
embedded chart's categories now follow each select dimension's declared option order, the reading
grid groups and dashboard charts already use (objectui#11809):

- the declared options come first, in their order;
- a value the options do not declare comes next, in the order the dataset returned it;
- the empty bucket comes last.

With two grouping dimensions, the outer one is laid out first and the inner one within each outer
group. A dimension whose field declares no options (a lookup, a text field, a date) keeps the order
the dataset returned it in.

A report that declares its own `order` keeps the server's order unchanged. A drill on a row still
opens that row's records.
