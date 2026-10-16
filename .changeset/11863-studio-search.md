---
'@object-ui/app-shell': minor
'@object-ui/i18n': patch
'@object-ui/console': patch
---

The Studio landing (`/studio`) gets search (objectui#11863). It mounts the command palette, so its header shows the "Search ⌘K" trigger and `Ctrl+K` / `⌘K` opens the palette. Until now only the frame inside an app mounted one, so the landing's header drew no trigger (objectui#11912's rule). The entry for the landing's new header says it shows no search trigger; with this change it does.

On `/studio` no app is active, so the palette leaves out everything that belongs to an app: the app's objects, dashboards, pages and reports, record search, app switching, and the "Open Full Search Page" command, whose link starts with `/apps/APP` (mounted without an app it would have gone to `/apps/undefined/search`). It lists the Studio instead, in three groups:

- **Packages**: the packages the Studio landing lists (kernel packages left out). Each opens its Data pillar, `/studio/PKG/data`.
- **Objects**: the objects of those packages, each opened in its package's Data pillar on that object (`/studio/PKG/data?surface=object:NAME`).
- **Flows**: the flows of those packages, each opened in its package's Automations pillar on that flow (`/studio/PKG/automations?surface=flow:NAME`), and the flows that belong to no package, opened in the package-less scope (`/studio/~org/automations?surface=flow:NAME`).

An entry matches the query by its label or its machine name, as the palette's other entries do; an object or a packaged flow shows its package's name beside it. Nothing is read until the palette opens. Objects and flows are the published ones from the metadata cache, so an item that is still only a draft is not listed. The theme commands and the recently viewed records stay.

**Clause-②: yes (widening).** `CommandPalette`'s props gain a second form, `scope="studio"`, which takes no other prop. The props a host passes inside an app (`apps`, `activeApp`, `objects`, `onAppChange`, `dataSource`) are unchanged and still required there; that form leaves `scope` out. The props type is not exported by name (the package entry exports `CommandPalette` only), so a host meets it as the component's props. No export is added or removed. `@object-ui/i18n` gains two keys in all ten packs, `console.commandPalette.packages` and `console.commandPalette.flows`, the headings of two of the new groups; the objects group reuses `console.commandPalette.objects`.
