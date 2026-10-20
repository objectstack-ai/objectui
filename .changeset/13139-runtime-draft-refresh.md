---
'@object-ui/app-shell': patch
---

The draft preview bar's count follows a runtime view-config Save or Publish without a reload (objectui#13139).

Saving a view config from a list page's Edit view config panel stages a draft, and its Publish promotes it, both through the runtime metadata persistence seam. That seam raised no metadata-refresh pulse, and the pulse is what the pending-drafts count (`usePendingDrafts`) re-reads on. So after a Save the bar still said there were no unpublished changes, and after a Publish it still counted the published change and offered "Publish to see it live", until the page was reloaded.

Every write in the seam now raises that pulse once the server has accepted it: a draft save (a view config or a report), a new view created as a draft, a draft discarded, and a publish. A refused write raises nothing. The pulse is the same one Studio, the chat and the bar's own Publish already raise, so the other pending-draft counts (the home banner, the Studio header, the chat bar) follow too, and the open metadata reloads in place as it does after those. A listener that fails cannot turn a write that landed into a reported failure.

Nothing is added to the package entry: no export, prop or type member changes.
