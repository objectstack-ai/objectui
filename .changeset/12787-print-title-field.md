---
'@object-ui/plugin-detail': patch
---

A record on a print page prints its own title field (objectui#12787). Off a print page, `record:details` hides the row that the page header's H1 already shows: the declared name field, the field a `titleFormat` resolves to, or the first title candidate that has a value. A print page refuses `page:header`, so nothing on paper showed the title, and a printed invoice had no invoice number. On a page that declares `print`, `record:details` now prints every field it declares, the title field included. Off a print page nothing changes.
