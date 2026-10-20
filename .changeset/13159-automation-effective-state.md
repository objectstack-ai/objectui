---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

Setup › Packaged automation no longer shows "On" for a packaged flow that does not run (objectui#13159). When the engine reports a flow as enabled but not armed — the automation status row carries an `unboundCause`, as every packaged schedule flow does while the deployment keeps package-authored scheduled work off — the Activation badge reads "Not running here" instead of "On". The switch beside it still shows and writes the activation flag, and the platform's sentence for why stays behind the row's Details chip. Bound flows, flows with no trigger and switched-off flows read as before. After a toggle the page reads the automation status again, because the toggle's answer carries the flag alone and the flip can change what the engine armed.

`@object-ui/i18n` adds `packagedAutomation.notRunning` to all ten language packs.
