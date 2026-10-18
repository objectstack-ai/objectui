---
'@object-ui/console': patch
---

The profile page states the access the console resolves, not the auth library's raw `user.role` (objectui#11866).

The badge under the name and the read-only *Role* field used to show `user.role`, falling back to `member`. That field is better-auth's own scalar, which the server no longer overwrites: a platform administrator's standing travels on the session as `isPlatformAdmin`, and `role` keeps better-auth's default. So the seeded administrator read as "user", in an untranslated machine word.

Both now show the verdict every console gate already acts on, `useWorkspaceAdminStatus` from `@object-ui/auth`: *Admin* for an administrator of the workspace (a platform administrator, an organization owner or admin), *Member* otherwise. The words are the existing membership-role labels (`organization.roles.admin` and `organization.roles.member`), so they are translated in every built-in language pack. Until the verdict settles, the page shows neither the badge nor the field rather than a guess.

This changes no access decision. No language-pack key, export or prop is added.
