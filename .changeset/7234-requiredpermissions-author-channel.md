---
'@object-ui/app-shell': minor
---

Say why a capability-gated action is missing, in the action designer (objectui#7234,
maintainer ruling 2026-09-08, option B).

`action.requiredPermissions` (ADR-0066 D4) is enforced with a 403 on the platform
action route and mirrored as a UI hide. The mirror is silent by design: a viewer who
does not hold every listed capability gets no button, no greyed-out control and no
message, at every declared location at once. An admin who had configured a set of
object-bound buttons, held no permission set yet, and opened the list saw nothing at
all — and read it as a broken feature, because nothing in the product said otherwise.

**End-user behaviour is unchanged, deliberately.** The action stays hidden, no new
end-user surface is added, and drawing the action greyed out with the missing
capability named was considered and rejected — it advertises to end users capabilities
they do not have. `ObjectView.objectBoundActions-7234.test.tsx` now pins that the
gated end-user surface explains nothing, so landing this reason on a running app's
list surface turns a test red.

What changes is the author-facing side, in the panel pair the Studio Data tab's
**Actions** config already uses:

- The inspector's **Placement** section, beside the existing "no placement selected"
  notice, names the gating capabilities and says the action is *hidden* rather than
  disabled. When the signed-in session is itself missing one of them it says so in the
  first person, reading the held set from `MePermissionsProvider` through
  `usePermissions` — the same signal `useCanAuthorMetadata` consumes, not a second
  client-side permission derivation. An unreported held set is treated as unknown and
  that clause stays silent, mirroring the gate's own fail-open doctrine.
- The **action preview** carries the capability line in its metadata strip and above
  its *Where it appears* frames, which previously drew the button in every declared
  location without qualification.

`content/docs/guide/console.md` states the hide and where the reason is shown.
