---
'@object-ui/i18n': patch
---

The cloud-connection panel's "Not connected" card no longer repeats the page subtitle (objectui#12655).

The card's body (`cloudConnection.unbound.body`) opened with the same sentence as the page header subtitle above it, so an admin read it twice. It now says the state and what the Connect button does: the runtime is not connected to a control plane, and Connect opens the cloud account in a new window, where one click approves the link, with no ids or credentials typed into the page. It names no control plane, because nothing the panel is served says which one Connect binds to. All ten language packs carry the new text in their own language. The key name is unchanged.
