---
'@object-ui/console': patch
'@object-ui/data-objectstack': patch
'@object-ui/i18n': patch
---

The console's Setup › Apps page reports what the server did with a write (objectui#12300). Before, a Delete and a Disable could report success for a write that changed nothing.

- **Delete.** When the reset door answers `reset: false` (there was no customization row to remove, so the app already is what its package ships), the page shows a neutral notice with the server's own sentence and never says "deleted". The row stays, because the server still serves it.
- **Disable, Set as default and the bulk Enable / Disable.** A save of an app that a package owns now names that package (`?package=`, read off the served `_packageId`), so it lands on the row the server serves. A package-less app is saved with no scope, as before.
- After every write, whatever it answered, the page re-reads the app list and shows the served state.

`ObjectStackAdapter` forwards every argument of `getClient().meta.saveItem`. Its save-advisory wrapper used to pass on only `type`, `name` and `item`, so the SDK's options bag (`packageId`, `force`, `mode`, `ifMatch`) was dropped before it reached the wire, for every caller of the adapter's client.

Two new `appManagement.toast` keys, `nothingToDelete` and `alreadyAtDefault`, ship in all ten language packs.
