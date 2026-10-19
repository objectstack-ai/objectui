---
"@object-ui/app-shell": patch
"@object-ui/data-objectstack": patch
---

One object-page open reads the published view list (`GET /meta/view`) once (objectui#13057). The adapter now stores the list its client read and answers `listViews` and `listViewOverrides` from it, so the provider's eager view read serves the page's two readers. The client read itself still always asks the server. Every path that should see a fresh list drops it first: a refresh of the object page, every view write (through the adapter, its client, or the console's `MetadataClient`, whose view saves, publishes, resets, rollbacks and package publishes now drop it), and an organization or session switch. The package sheet's *Publish app* now announces the publish like every other publish path, so open views, forms and navigation re-read what went live. The draft-preview list read is unchanged and never fills the stored list.
