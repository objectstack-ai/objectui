---
'@object-ui/console': patch
---

The Audit Log's Action, Actor, From and To filters are named by their visible labels (objectui#13224).

Four of the five filters drew a label that named nothing, so assistive technology announced an unnamed combobox, an unnamed lookup and two unnamed date fields, and voice control could not reach them by name. Each label now names its own control, as the Object filter's already did: the Action select, the Actor lookup's trigger, and the From and To date fields. The filters' options, the query they send and the layout are unchanged.
