---
'@object-ui/app-shell': patch
---

On a free-plan organization, the environment list's locked mark, "Development environments · Team plan and up" (zh 「开发环境 · 团队版起」), is now drawn only for a viewer who can upgrade (objectui#12983, ruling B on objectstack-ai/cloud#2917: the development upsell reaches only whoever can upgrade).

**What changed, in observable terms.**

- The signal is the entitlement summary's `upgradeUrl`. The control plane sends it only to a viewer who manages the organization, so its presence is the server's own answer to "can this viewer upgrade?". No viewer flag is read or added.
- A viewer the summary sends an `upgradeUrl` to (an owner or an admin) sees the mark as before: an outline link to that URL, opening no dialog.
- A viewer it sends none (a plain member) sees no mark. Nothing stands in for the create action in that state, since the member can neither create a development environment on this plan nor upgrade it.
- The unlinked variant of the mark, drawn when the summary carried no `upgradeUrl`, is retired. It was added earlier in this release cycle and never shipped in a release.
- Unchanged, for every viewer: the toolbar's other actions, the "Set up your production environment" and "Add development environment" states (a plain member on a paid plan still gets "Add development environment", zh 「新建开发环境」), the loading skeleton, and the `?runAction=create_environment` deep link, which is still consumed in the plan-locked state and opens nothing.

**Exports.** No export of `@object-ui/app-shell` changes, and no locale key is added or removed: the linked mark keeps `environment.developmentLocked` and `planTier.teamAndUp`.
