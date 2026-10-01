---
'@object-ui/app-shell': patch
---

The Studio page-block inspector's `element:text` **Variant** select offers the nine values `ui:text` publishes (Heading 1 to Heading 6, Body, Caption, Overline) in place of Heading, Subheading, Body and Caption (objectui#7450).

`heading` and `subheading` are no longer offered. The installed `@objectstack/spec` still accepts both and `element:text` still renders them, but a later spec release retires them, so the designer stops writing them now. A block that already stores one keeps it, and the select shows it as a flagged value. The designer's en and zh tables drop the two labels and add the seven new ones.
