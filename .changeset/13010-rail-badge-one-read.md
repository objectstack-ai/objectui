---
'@object-ui/components': patch
'@object-ui/plugin-detail': patch
'@object-ui/app-shell': patch
---

A record page that shows the same unfiltered related list both as a `record:reference_rail` card and in a `page:tabs` count badge now reads that list once on open, not twice. The rail claims its rows in `RelatedCountStore` while it renders; the badge's probe then asks for the card's rows with its count, and the card takes them. If the rail reads first, the badge joins that read. A badge with its own declared filter still sends its own probe. A rail alone on the page still reads only when it comes into view, and a refresh still reads the rail again.
