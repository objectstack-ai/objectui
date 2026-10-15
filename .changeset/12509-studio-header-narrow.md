---
'@object-ui/app-shell': patch
---

The Studio header no longer overlaps on a narrow window (objectui#12509).

Below 640 px the header now takes two rows: home, the package chip and the package actions (Create app, Changes, Publish) on the first, and the Data · Automations · Interfaces · Access switcher across the full width on the second, one icon per pillar. Before, the switcher's Access segment sat under Changes and Publish was cut off at the right edge.

From 640 px up the header stays one 48 px row. Between 640 and about 710 px the Create app button used to slide under the switcher. The actions now keep their full width and the switcher moves left instead. The package name shortens when the row is tight. From 1280 px up, nothing changes.

Each pillar keeps its name as the link's accessible name and tooltip. The "Studio is built for a desktop screen" note is unchanged. No export, prop or language-pack key changes.
