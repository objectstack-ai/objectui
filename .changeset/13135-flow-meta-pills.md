---
'@object-ui/app-shell': patch
---

Studio's flow header no longer clips its meta mid-word (objectui#13135). With the Properties panel open, "Trigger: … · Status: … · Run as: …" was cut off at the edge of the header ("Status: Unpublis") with no ellipsis and no tooltip. Each item now shortens with an ellipsis when the row is too narrow, and a shortened item shows its whole "Label: value" on hover, followed by the hover text it already had (such as the run status's reason). The row stays on one line, so the header keeps its height. The designer's info bar is unchanged.

Nothing is added to the package entry: no export, prop, type member or copy.
