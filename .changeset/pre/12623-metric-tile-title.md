---
'@object-ui/plugin-dashboard': patch
---

Metric tiles keep their title readable in narrow tiles. The title now owns the first line (up to two lines, with an ellipsis on the second), the value never wraps and steps down one size in a tile narrower than 160 px, and a dataset-bound tile's measure label moves to a small line under the value, hidden below 160 px and always available in the title's tooltip. The width rules follow the tile's own width, not the window's, so dashboard tiles, page KPI blocks and the Studio canvas all behave the same.
