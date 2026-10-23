---
'@object-ui/react': minor
'@object-ui/components': minor
'@object-ui/app-shell': patch
---

A record page inside the Setup app no longer draws the floating managed-by badge (the amber "Identity" chip at the top-right of an organization, team, business unit or user record) (objectui#13385). The header's object label ("Organization") carries the badge's note instead: hovering or focusing it shows "Organization · Managed by the identity provider", and the note is the label's accessible description. The note is the badge's own tooltip title, under the same gate: only a caller who can author metadata sees it, and a `platform` object shows none. Every record page outside Setup, a `sys_*` object opened in another app included, and every list header keep the badge unchanged.

`RecordContextValue` (`@object-ui/react`) gains an optional, host-injected `objectLabelNote`, which `page:header` forwards to `RecordTitleChip`. `RecordTitleChip` (`@object-ui/components`) gains an optional `objectLabelNote` prop: with it the object label becomes a focusable tooltip trigger described by the note; without it the label draws exactly as before.
