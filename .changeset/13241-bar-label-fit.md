---
'@object-ui/plugin-charts': patch
---

A category x axis rotates its labels, and cuts them at 12 characters, only when the measured band cannot hold them (objectui#13241). A full-width bar chart now draws a name such as "Needs Analysis" whole and horizontal instead of "Needs Analy…"; a narrow widget whose labels do not fit keeps rotating and cutting them, with the full name on the bar's tooltip. Until the chart's width is measured, the length rule applies as before.
