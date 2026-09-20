---
'@object-ui/app-shell': minor
---

**Breaking — the published `RootRedirect` is removed; `/` now has exactly one resolver.**

`/` had two answers in this repo, and the published one was the poorer. This
package exported `RootRedirect`, which sent `/` to `/home` as soon as metadata
finished loading — ignoring the app a product declares with `isDefault`, the
same declaration every Home affordance in the console chrome follows
(objectui#7256). The console that actually ships never mounted it: it mounts an
element that resolves the landing from the app metadata, where the `isDefault`
app wins, a single visible app that is not the platform Setup console is
entered directly (objectui#4048), and an app list that never loaded refuses to
conclude anything at all (objectui#4233). A consumer assembling a console from
these building blocks got the unguarded answer, and nothing said so.

The two become one by removing the published twin rather than by moving the
guarded one. The console's own `/` behaviour is unchanged by this release.

**What this means for a consumer.** If your route table mounts `RootRedirect`
at `path="/"`, the import no longer resolves and the build fails — this is a
compile error, never a silent change of where your users land. Route `/` in
your own route table instead; `examples/console-starter` shows the smallest
form of it, landing on `/home` inside the same `AuthenticatedRoute` guard it
used before. Every other console building block — `ConsoleShell`,
`ConnectedShell`, `AuthenticatedRoute`, `RequireOrganization`, `SystemRedirect`,
`SetupRedirect` — is untouched.

Marked `minor`, not `major`: this repo's fixed release group is pinned to the
`@objectstack` major (AGENTS.md, 版本号策略), so a breaking change is declared in
the narrative rather than in the bump.
