---
'@object-ui/app-shell': patch
---

The `/data` page's generated filter bar now offers single-value relation fields (`lookup`, `master_detail` and `user`) beside the picklist fields (objectui#13310). A relation chip opens the list's existing remote-search picker, which queries the related object through the caller's data source, and a pick filters the rows by the related record's id. The selection persists in the same `uf_*` URL params as the picklist filters, so it survives a reload; an id that no longer resolves shows as the id.

So an organization's Members "View all" page, which anchors no declared view, can now be filtered by User as well as by Role.

Picklist fields keep their slots: relation fields follow them in declaration order and take only the slots the picklists leave under the bar's four-field cap. A multi-value relation (`multiple: true`), a hidden field and a field the caller cannot read are not offered. An object without a single-value relation field renders the same bar as before.
