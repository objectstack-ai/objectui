---
'@object-ui/app-shell': minor
---

Studio design surface: one layout skeleton for the four pillars (objectui#12459, epic objectui#12446). The shell header is a 48px three-column grid — the package drawn as an app chip, the pillars as a centered segmented control, Changes with its pending count as a pill. A shared 240px rail (`StudioRail`), a shared 300px inspector aside (`StudioInspector`) and an item-header + tab-row scaffold (`StudioItemHeader`) are what Data, Automations, Interfaces and Access now render into; the three pillar-specific bands above the rail retire into the item header. Pillar bodies are unchanged.
