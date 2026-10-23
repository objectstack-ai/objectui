---
"@object-ui/plugin-charts": patch
---

charts: a line or area chart no longer cuts its first or last x-axis label at the chart's edge. recharts draws their categorical x axis as a point scale, which puts the edge categories on the plot edges, so a monthly trend chart drew its newest bucket "2026-10" as "2026". The axis is now inset at both ends by half a `YYYY-MM` label at the tick font. Bar charts, whose band axis already centres every category, and combo charts, which draw a value axis on each side, are unchanged (objectui#13390).
