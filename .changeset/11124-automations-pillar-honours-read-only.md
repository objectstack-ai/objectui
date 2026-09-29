---
'@object-ui/app-shell': patch
---

fix(app-shell): Studio's Automations pillar honours a read-only package on its Enabled switch, flow inspector and canvas

On a read-only package (a source-loaded package, `writable: false`) the
Automations pillar hid "New" and blocked autosave, but three flow-authoring
affordances ignored the flag:

- The header "Enabled" switch stayed clickable. A click saved a flow draft the
  server refused (`ITEM_LOCKED`), and the switch and the canvas status went on
  showing the refused value until the pillar was reopened. The switch is now
  disabled on a read-only package, with the read-only hint as its title.
- The flow inspector was created with a hardcoded `readOnly: false`, so a node
  edit took on the canvas and was silently discarded. It now receives the
  pillar's real flag, the way the Data pillar threads it (objectui#2259), and
  its inputs render disabled.
- The canvas was handed the pillar's `onPatch`, so adding, inserting, dragging
  and deleting nodes all took locally and were then thrown away. On a
  read-only package it now gets no `onPatch`, which the preview contract reads
  as read-only; clicking a node or edge still opens the inspector, read-only.

On any package, a refused status toggle now rolls back: the draft's `status` is
put back to what the toggle started from, so the switch never shows a state the
server refused. Only `status` is restored, so an edit made while the save was in
flight survives, and a refusal that lands after the author opened another flow
leaves that flow untouched.
