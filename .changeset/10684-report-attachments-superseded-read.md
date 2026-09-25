---
'@object-ui/app-shell': patch
---

fix(app-shell): the report view and the `record:attachments` block show the answer to their current read, not an earlier answer that arrived late (objectui#10684)

`ReportView` read its report's rows with no check that the read was still the
current one. When the report changed while a read was in flight (another report
on the same route, a config-panel edit or a metadata refresh), the earlier
answer could arrive after the current one and replace its rows. Its data effect
now drops an answer once a newer run has started.

The attachments panel behind `record:attachments` wrote its list and its loading
status on every refresh. When the record changed while a read was in flight, the
previous record's attachments could replace the current record's list, or
settle first and end the loading state while the current read was still out.
Each refresh now takes a run number, and only the newest one writes the list and
the status.
