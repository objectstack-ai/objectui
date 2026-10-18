---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

Studio's "Organization flows" page no longer says its drafts publish atomically, and a deep link to a flow that is not on the page no longer says no metadata designers are registered (objectui#11591).

On the package-less page (`/studio/~org/automations`), the pending-changes sheet read "Publishing releases the 1 pending draft of this package atomically." That page has no package, and its Publish promotes each draft by itself: a draft that fails stays pending while the others go live. The sheet now says so there, through a new `preview.changes.confirmNoteSeparate` plural family in all ten language packs. A package's sheet keeps its sentence unchanged. `DraftChangesPanel` picks the sentence from its `packageId` prop: with a package, the atomic sentence; without one, the per-draft sentence.

On the Automations pillar, the canvas chip read the designer registry for the open flow's type. With no flow open (a deep link naming a flow the list does not hold, or an empty list), it found none and showed "No metadata designers are registered in this session…" beside the right message, on a page whose flow designer is registered. The chip now reads the registry for the pillar's own type, `flow`, as the configuration panel beside it already did. The notice still shows when no designer is registered, whether or not a flow is open.
