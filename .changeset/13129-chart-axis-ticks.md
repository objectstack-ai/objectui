---
'@object-ui/plugin-charts': patch
---

Advanced chart axis tick labels now use the theme's muted foreground instead of recharts' default `#666`, so they stay readable on dark cards (objectui#13129). Every axis the advanced chart draws, cartesian and polar, shares one tick style.
