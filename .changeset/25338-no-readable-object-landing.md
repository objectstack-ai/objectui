---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

A member who may read none of the objects an app names now lands on one page that says they need access and whom to ask, instead of the app's dashboard drawn as a grid of "You don't have access" tiles (objectstack-ai/objectstack#25338).

The app root's landing asks the object-read prune's own verdict (`useNavMemberGates().can`) over every `type: 'object'` entry the app names, at every depth and in every area. When the app names at least one object and the member may read none of them, it renders `AppNoAccessEmptyState` with the new `reason="no-readable-object"`: "Your account cannot read any of the records in this app yet. Ask an administrator to assign you a permission set.", plus the Setup link for a member who may grant access. One readable object, or an app that names no object at all, lands exactly as before.

Clause-②: yes
Metadata-protocol: none
