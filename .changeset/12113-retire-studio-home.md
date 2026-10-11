---
'@object-ui/app-shell': patch
---

The Studio app's root now opens the app's first navigation entry, like every other app's root, and `StudioHomePage`, Studio's old metadata overview, is retired (objectui#12113).

An app's root opens its first navigation entry that leads to a page in the app. The console skipped `component` entries when it looked for that entry, so the Studio app, whose navigation is made only of `component` entries, found none and fell back to `StudioHomePage`. The console now takes `component` entries too, at the same URL the sidebar links them to. With the platform's Studio navigation, the root opens the App Builder (`/apps/studio/component/studio/builder`).

Removed with the page:

- the Studio sidebar's "Home" row, which linked the app root;
- the page's strings in the metadata-admin string table (`engine.home.*`, except `engine.home.recent`, which the App Builder landing reads). The `@object-ui/i18n` language packs are unchanged.

Other apps whose first entry is a `component` entry open on it as well. Two platform apps are such apps:

- the Account app opens on Profile, the entry its navigation declares first, instead of Notifications;
- Setup, for a user whose navigation does not include the System Overview dashboard, opens on the first entry of its Apps group (Packages, as the platform declares it) instead of skipping past it.

An app whose first entry is an object, page, dashboard or report entry opens where it did, and an app that serves the user no navigation still opens on the "Nothing in APP is available to you yet" empty state. An app whose entries are all links that lead out of it now shows no page at its root, where it used to show `StudioHomePage`.
