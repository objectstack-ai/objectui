---
'@object-ui/console': patch
---

fix(console): mint a `sys_file` id for files picked in the global action dialogs

The console's `UploadProvider` was mounted inside `AppContent`, the element of
a single route (`/apps/:appName/*`). But `ConnectedShell`'s
`GlobalActionRuntimeProvider` renders the action-param dialog and the
`ModalForm` a modal action opens as SIBLINGS of the route element, so those
dialogs rendered outside the provider — and `useUpload()` fails open, silently
substituting `createObjectUrlAdapter()`, which mints a `blob:` URL locally and
reports success.

A file picked in one of those dialogs therefore produced no upload request at
all; `fileValueForSubmit` stored the legacy inline blob instead of a `sys_file`
reference, and the engine rejected the record with `expected string, received
object` — an error that points at serialisation while what is missing is the
upload.

The provider now sits above `ConsoleShell`, so one upload destination serves
every console surface, and it is built with `createAuthenticatedFetch` so the
storage routes see the session (and the `X-Tenant-ID` the rest of the session
carries) instead of a bare cookie-only `fetch`.
