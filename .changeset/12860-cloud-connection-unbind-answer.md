---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

The Cloud Connection panel reads the answer to **Disconnect** (objectui#12860).

- **The revoke did not reach ObjectStack Cloud.** When the server answers `revoked: false`, it has cleared its own credential but the cloud never heard the revoke. The panel still shows **Not connected**, and now adds a notice: this server is disconnected, ObjectStack Cloud could not be told, so the cloud account may still list the connection, and it should be removed there. The notice stays until the next **Connect**, or until a status read finds the server connected again.
- **A successful revoke is unchanged:** `revoked: true` shows **Not connected** with no notice.
- **Disconnect refused for lack of Setup access.** When the server refuses with `403 PERMISSION_DENIED` (the `setup.access` gate), the panel no longer falls to an error screen showing the server's English message. The connected card stays, because the connection still exists, and says in the viewer's language that disconnecting needs Setup access. Other refusals are shown as before.

`@object-ui/i18n` adds four `cloudConnection` keys in all ten language packs: `bound.disconnectNeedsSetupAccess` and `unbound.revokeNotReached.disconnected`, `.cloudMayList` and `.removeInCloud`.
