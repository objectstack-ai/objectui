---
'@object-ui/app-shell': patch
---

fix(app-shell): the environment entitlement dialog renders no upgrade CTA when the control plane sends no upgrade URL

The dialog shown when an environment create is gated by plan or capacity
(`DEV_ENV_PLAN_LOCKED` / `DEV_ENV_LIMIT`) filled a missing `upgrade_url` (403
path) or `upgradeUrl` (entitlement summary) with a client-side default,
`/settings/billing`. The CTA is a full-page anchor resolved against the
control-plane origin, and no router serves that path: the Console declares
`settings` only under `/organizations/:slug`, and the control plane mounts its
console under `/_console`. A user who clicked "Upgrade plan" landed nowhere.

The default is gone (objectui#10437). The upgrade destination is the control
plane's to name. When it sends one, the CTA links to it verbatim, exactly as
before. When it sends none, the dialog still explains the gate but offers no
link, which is the rule objectui#7273 set for the tenant Console's upgrade
exit. The entitlement state no longer carries a synthesized URL either: its
`upgradeUrl` is the summary's value or absent, and the row-derived and unknown
states have none.
