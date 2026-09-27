---
'@object-ui/app-shell': patch
'@object-ui/console': patch
---

fix(app-shell, console): `ActionParamDialog` and `FormPage` hold their submit while an `avatar` upload is in flight

`AvatarField` now uploads its pick through the ambient `UploadProvider` and hands the `sys_file` id to `onChange` only once the adapter settles, reporting the wait through `onUploadingChange` (objectui#10785). Both hosts handed that callback to `file` and `image` alone, so a Confirm or Submit pressed during an avatar upload went out without the avatar and reported success, the objectui#10167 class. `ActionParamDialog` (`@object-ui/app-shell`) and `FormPage` (`@object-ui/console`, `/f/:slug` and `/forms/:name`) now gate `avatar` too: the button is disabled and reads "Uploading…" until the upload settles.
