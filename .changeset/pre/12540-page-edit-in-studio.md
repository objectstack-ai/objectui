---
'@object-ui/app-shell': patch
---

A console page's "Edit in studio" button opens the page in Studio, where every other Studio handle on the same screen goes (objectui#12540).

On a page route the app bar's pencil, the app switcher's Studio row and the sidebar's Design open the page's surface in Studio's Interfaces pillar (`/studio/PACKAGE/interfaces?surface=page:NAME`). The page's own "Edit in studio" button opened the metadata-admin page instead. It now builds its target the way the pencil does, from the app the route is in and the page's name.

The button is drawn only when that target exists. It still needs the metadata-authoring capability the server reports, as before. It is now also absent when the page's app has no owning package Studio can open (a runtime or database-authored app). There it used to open the metadata-admin page; it no longer falls back to it, as the pencil does not.
