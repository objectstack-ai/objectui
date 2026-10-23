---
'@object-ui/app-shell': patch
---

Studio says when a display name yields no identifier, and Add field no longer names a field `field_<N>` behind the author's back (objectui#13389).

A display name with no Latin letters (a Chinese one, say) makes no identifier, since identifiers take lowercase letters, digits and underscores only. Before this change the identifier box stayed empty and Create stayed off, and nothing said why. New object and the other Studio create dialogs now say it under the identifier and ask for one. On New package, the line under Package ID gives the same reason instead of "Filled in from the display name until you edit it".

Add field shows the api name the label derives before Create. When the label derives none, or derives a name another field already has, the popover shows an API name box and Create waits for a name. Before, the field was created as `field_<N>`, and that name becomes the column and the API field name once it is published. A Latin label works as before.
