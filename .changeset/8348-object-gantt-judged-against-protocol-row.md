---
---

`object-gantt` is judged against its own protocol row (objectui#8348). No behaviour change and no release.

Its `data` arm was decided through this repo's own `ObjectGanttSchema.data` while `@objectstack/spec` published no `ComponentPropsMap['object-gantt']` row. Ruling batch #136 item 3 (Q1-C) had the protocol gain the row; `dataArmSpecRow-8348.test.ts` now derives the arm from the INSTALLED row and compares it with the arm table for every key this plugin registers, so a spec release that moves the row turns it red. The verdict is the same `ViewData` arm, so nothing a document can express moves; the `rawDataConfig` comment now points at that pin instead of restating the interim reading.
