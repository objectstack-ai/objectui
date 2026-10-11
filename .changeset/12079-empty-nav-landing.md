---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

An app that serves the signed-in user no navigation now opens on an app-level empty state, not on the Studio home (objectui#12079).

The server filters an app's navigation per user. When every group is gated on a capability the user does not hold, the app arrives with `navigation: []`. The console's app index route found no landing page and rendered `StudioHomePage`, Studio's metadata overview, inside an app that had nothing to do with Studio. This was measured on HotCLM for its dev admin (objectstack-ai/hotclm#87).

The app root now shows "Nothing in APP is available to you yet", with the app's own label. A user the console treats as a workspace administrator (`useWorkspaceAdminStatus`, the same check the console's no-app screen and Home's administration links use) gets an "Open Setup" link, at the URL the `/setup` deep link resolves. Everyone else is asked to contact an administrator.

Unchanged:

- An app with a landing page still opens on it.
- The Studio app still opens on its own home. Its navigation is full but holds only `component` items, which the landing resolver does not walk, so it reaches the same fallback with a non-empty navigation.

New `@object-ui/i18n` keys, in all ten language packs: `empty.appNothingAvailable`, `empty.appNothingAvailableDescription`, `empty.appNothingAvailableGrantDescription` and `empty.openSetup`.
