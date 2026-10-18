---
'@object-ui/plugin-kanban': patch
---

The kanban swimlane that holds cards with no value in the swimlane field is headed by the pack's `kanban.uncategorized` instead of the English constant (objectui#12899). Under a non-English locale the lane heading, and the lane cell's accessible name, now read the translated word. Only the display changed: the lane is still bucketed, counted and collapsed under the same key, so a card whose value is literally "Uncategorized" keeps sharing that lane.
