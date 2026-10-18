---
'@object-ui/plugin-dashboard': patch
---

A metric tile's value now scales before it would clip. A long value, such as a seven-digit money figure with cents (`1,290,000.00`), steps down from 24 px to 14 px as the tile narrows, so it fits whole in a 156 px tile instead of ending in an ellipsis. A short value keeps its 20 px / 24 px face. A value too wide for its tile even at 14 px keeps the ellipsis and shows the full figure as its tooltip. This applies to `MetricCard`, `MetricWidget` and every `object-metric` page block.
