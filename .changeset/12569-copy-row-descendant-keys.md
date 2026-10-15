---
'@object-ui/plugin-detail': patch
---

Record details: Enter on a link inside a read-only details row that offers copy now opens the link, instead of copying the row's value (objectui#12569).

- **The defect.** A read-only details row that offers copy is a focusable button: Enter or Space on it copies the field's value. Its key handler cancelled Enter and Space and copied the value whatever the key was pressed on, so Enter on a link drawn inside the row (a lookup's link to the referenced record, or the links in the record card an approval request's Details tab draws for its target) copied the row's value and did not open the link.
- **Now.** The row copies only for Enter or Space pressed on the row itself. A key pressed on a link, a button or anything else focusable inside the row is left to that element: a link opens, and the row's own copy button still copies through its click. Both row layouts (the default row and the phone layout's row) follow the same rule.
- **Unchanged.** A mouse click on the row, or on a link inside it, behaves as before; Enter and Space on the row itself still copy; Escape still does nothing; rows that offer in-place editing still have no copy handler.

**Clause-②: no.** No export, prop, type member or i18n key is added or removed.
