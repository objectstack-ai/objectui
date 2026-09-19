---
'@object-ui/app-shell': minor
'@object-ui/console': minor
---

The console's error-recovery exits follow the declared landing (objectui#7373).

`app.isDefault` declares where a deployment's home is, and objectui#7256 (PR #7372)
made the console chrome's four Home affordances read it through `useHomePath()`.
The "you cannot be here" exits kept naming the environment launcher literally, so a
control-plane customer who hit one landed on a screen whose "Build an app" /
"Start from a template" cards act on an environment their deployment does not have
and whose "Your apps" tiles are the control plane's own internal management apps.

Retargeted onto the existing policy — no new one was written:

- `AppContent` — the access-denied screen's "Back to home", and the bounce for a
  viewer with no app to enter;
- `RequireAiSurface` — a runtime that serves no AI agent (its `redirectTo` prop
  still wins when a host passes one; only the default moved);
- `AiChatPage` — the no-agent screen's Home, and the collapse-to-dock landing on a
  cold deep link. `resolveCollapseToDockTarget` now takes the home path as a
  required argument instead of naming one;
- `StudioDesignSurface` — eviction when the package under the editor is deleted,
  and the header's Home button;
- `apps/console`'s `/studio` entry gate and the Studio front door's wordmark.

Accepting an organization invitation follows the declaration too, by a different
route and for a measured reason: it runs immediately after `switchOrganization`,
so the app list in hand there still belongs to the organization being LEFT
(`MetadataProvider` drops its cache on an org change and refetches after that line
has run). Reading the declaration in place would name the previous organization's
app. It now reloads onto the console ROOT — the shape `WorkspaceSwitcher` and
`OrganizationsPage` already use for this same transition — so
`RootLandingRedirect` resolves the landing for the organization the user has just
joined.

Every ordinary environment is unchanged: where nothing declares a landing, and
wherever the app list is not (yet) an answer, the resolved path IS `/home`.

Two sites deliberately keep the launcher: `HOME_LAUNCHER_PATH` itself (it is the
launcher, and the fallback all of the above resolve through — ADR-0075), and
`RootRedirect`, which is `/`'s landing rather than a recovery exit and has its own
resolver.
