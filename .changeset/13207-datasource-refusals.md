---
'@object-ui/app-shell': patch
---

Setup → Datasources draws a refusal as a refusal (objectui#13207).

- **Test.** A test that answers `{ ok: false, error }` now raises an error toast with the server's text. It used to raise a green success toast carrying the failure text. A test that succeeds still raises a success toast.
- **Sync objects.** When reading the remote tables is refused, the Sync dialog now shows the server's message. It used to show "No remote tables found on this datasource.", so a refusal read as an empty datasource. That copy now shows only when the read succeeds and returns no tables. The refusal raises an error toast only when the dialog was closed before it arrived.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
