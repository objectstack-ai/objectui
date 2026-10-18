---
'@object-ui/app-shell': patch
---

Console: a create-workspace refusal carrying objectstack's `ORGANIZATION_CREATION_DISABLED` code now shows the localized "Creating new organizations is disabled on this instance." sentence (`workspace.multiOrgDisabled`, the one the dialog's own guard already shows) instead of the server's English sentence in every locale.
