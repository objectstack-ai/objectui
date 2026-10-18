---
'@object-ui/app-shell': minor
---

The console renders a record on a NAMED record page (objectui#12715, the objectui layer of the print-page series).

**URL shape:** `/apps/APP/OBJECT/record/ID/page/PAGE` (route `:objectName/record/:recordId/page/:pageName`, exported inside the console as `RECORD_NAMED_PAGE_ROUTE`). It shows record ID of object OBJECT on the record page named PAGE, so a page that is not the object's default record page (an invoice document, a delivery note) renders for the same record at a URL a browser can load. The server's print service can bind to this spelling to print any record page, not only the default one.

- PAGE renders only when it is a record page bound to OBJECT (`type: 'record'`, `object: OBJECT`). A page that declares `print` renders with its print stylesheet and print root (`data-print-page`), and `window.__objectui.idle` behaves as on the record route.
- Any other name (an unknown name, a page that is not a record page, another object's record page) shows the console's "Page not found" state. It never falls back to the object's default page and never renders the other page, and it reads no record. While the page list loads, only the skeleton is drawn.
- The record route `/apps/APP/OBJECT/record/ID` is unchanged: it still opens the object's default record page.

The name is a path segment, beside the record route's `/edit`, not a query parameter: an optional query would let a stray parameter change which document the record route draws.
