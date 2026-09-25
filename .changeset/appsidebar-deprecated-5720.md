---
'@object-ui/app-shell': patch
---

`AppSidebar` was marked `@deprecated` in favour of `UnifiedSidebar`
(objectui#5720), and objectui#5817 then removed it from `@object-ui/app-shell`.
The two changes publish together; the removal's own entry carries the migration
detail.

A census (objectui#5720) found `AppSidebar` had no in-repo mount point
(`ConsoleLayout` renders `UnifiedSidebar`, not this component) and no
downstream consumer visible anywhere across this org's GitHub-visible
repositories. It was deprecated rather than deleted at first because
`@object-ui/app-shell` is a public npm package (`publishConfig.access: "public"`)
and an external consumer outside this org is structurally invisible to that
census; the maintainer then ruled that the removal need not wait for a major
release.

Migration: replace any `AppSidebar` usage with `UnifiedSidebar` from the same
package.
