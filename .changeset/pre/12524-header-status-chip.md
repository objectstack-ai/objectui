---
'@object-ui/app-shell': patch
---

Studio: the draft status chip sits in the same place in every pillar's item header (objectui#12524). "Unpublished draft" in Data, Automations and Interfaces, and Access's "saved as draft" note, now follow the item's title and its name or kind chip, before the meta line. In Interfaces it no longer sits among the Design / Run actions at the right of the header, which now holds actions only. `StudioItemHeader` draws the chip from a new `status` prop, so a pillar passes the status and no longer places or styles it.
