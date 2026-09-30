---
'@object-ui/app-shell': patch
---

fix(app-shell): switching Studio to another flow, page or package no longer saves the previous item's unsaved edit into the one just opened

Studio's editors save drafts on their own, 1.5 s after the last edit. If the
author opened another flow or page inside that wait, and the new item took
longer to load than was left of it, the pending save went out addressed to the
item just opened, carrying the previous item's whole document. The newly opened
item's draft was overwritten with another item's content. This was measured on
a writable package in the Automations pillar (one flow saved with another
flow's steps) and in the Interfaces pillar's page settings (one page saved with
another page's label and blocks).

An unsaved edit now belongs to the item it was made on. When the author opens
another item before it is saved, nothing is sent to the item just opened, and
the pending edit is dropped, which is what the Data pillar has always done and
what every editor already did whenever the next item loaded quickly. An edit
made after the new item has loaded saves to it as usual. This applies to every
editor that uses Studio's shared draft autosave: the Automations and Data
pillars, the Interfaces page inspector and the Interfaces navigation editor.

Switching package in the Interfaces pillar now starts it afresh on the new
package. Before, an unsaved navigation edit the author chose to discard kept
the editor marked as having unsaved changes, so the next package's navigation
was saved as a draft although nobody edited it, and the previous package's
open page stayed open and saved into the next package.
