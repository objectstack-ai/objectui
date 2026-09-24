---
"@object-ui/plugin-list": patch
---

fix(plugin-list): gallery cards now pass a field's declared `scale` to the shared cell renderer, so a number or percent field declaring `scale` renders padded (`25.00%`) exactly as Grid and Detail do, instead of unpadded (`25%`). (objectui#9575)
