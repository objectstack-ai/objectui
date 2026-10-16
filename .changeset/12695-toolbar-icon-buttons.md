---
'@object-ui/plugin-list': patch
---

The list toolbar draws Filter, Sort and Display as 28 px icon buttons at every width, on every list that mounts it: app object lists, Setup lists and related lists (objectui#12695). Filter shows a funnel, Sort the up-and-down arrows, and Display the sliders, which Filter used to draw. None of the three shows a text label any more; each count badge stays beside its icon and is the only text in the tool cluster, so the cluster takes less room beside the view tabs.

Each button keeps its accessible name and now carries a tooltip with it: "Filter" (or "Filter, N active" with filters applied), "Sort" and "Display". Sort gets a name of its own, since the label it was named by is gone. The popovers, the search button and the add button are unchanged, and Sort still hides below the `sm` breakpoint as before.
