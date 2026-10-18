---
'@object-ui/plugin-detail': patch
---

A collapsible record details section on a print page prints its header as a plain heading, with no disclosure chevron and no clickable-header chrome (objectui#12732).

On a page that declares `print`, a collapsible section already draws open, but its header still drew the screen control: a toggle button, a chevron, and the pointer and hover styling of a clickable header. On a print page the section now renders the way a non-collapsible section does: the title, the icon, the header colour and the description, with the content always shown. Off a print page the collapsible header is unchanged.

Clause-②: no
