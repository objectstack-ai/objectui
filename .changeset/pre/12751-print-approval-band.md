---
'@object-ui/plugin-detail': patch
---

A record on a print page no longer prints its approval band: no "Recall approval" button, no approval status badge and no approval tally on paper (objectui#12751).

On a page that declares `print`, a record in approval put the screen's approval band on paper: the recall button, the "In approval · editable" or "Locked for approval" badge, and the "Approvals — 0 of 1" tally. The button is a control. The badge and the tally are the approval's live state, which differs by viewer and changes with each decision, the same reason a print page refuses `record:approvals` and `record:approval_decision`. On a print page the band is now not drawn, and the record's fields print as before. A printed record that should state its approval status prints the record's own status field through `record:details`. Off a print page the band is unchanged.

Clause-②: no
