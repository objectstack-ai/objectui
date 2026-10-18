---
'@object-ui/app-shell': minor
---

Studio design surface: Access is the fourth segment of the pillar nav, which now reads Data · Automations · Interfaces · Access (objectui#12452, epic objectui#12446 decision A). The "More" popover that held Access alone retires, together with its `studio-nav-more` test id and the `engine.studio.more` string. The Access segment carries the shield glyph and the same unsaved-changes guard as every pillar, and the open pillar's link is marked `aria-current="page"`.
