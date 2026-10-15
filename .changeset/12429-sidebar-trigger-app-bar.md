---
'@object-ui/app-shell': minor
---

The console shell's sidebar trigger now lives in the app bar's left slot at every width (objectui#12429). Inside an app it is the bar's leftmost control: on a phone it opens the navigation drawer, and from the tablet breakpoint up it collapses the sidebar to its icon rail and expands it again, from the same spot. The trigger that sat in the sidebar's footer is gone, along with the footer, so exactly one trigger renders at every width. The trigger reports `aria-expanded` for the state it toggles and shows a tooltip naming the ⌘B / Ctrl+B shortcut. The shortcut, the collapsed-state persistence and the icon rail's contents are unchanged.
