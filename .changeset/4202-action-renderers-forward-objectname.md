---
'@object-ui/components': minor
---

The four declared action renderers (`action:button`, `action:icon`,
`action:group`, `action:menu`) now pass an action's `objectName` to the action
runner, and `action:button`, `action:icon` and `action:group` now honour a
code-composed `onClick`.

**`objectName`.** `@objectstack/spec` declares it on `ActionSchema` as the
object the action belongs to, and the console resolves where an action is
dispatched as "the action's `objectName`, else the page's object" — in its api
and flow handlers, in the param dialog's label scope, and in
`createServerActionHandler`'s `/api/v1/actions/{object}/{action}` URL. These
four renderers built the runner's input from a key allowlist that left
`objectName` out, so an action declaring another object (for example a child
record's action rendered on its parent's page) was silently dispatched against
the page's object instead.

**Behaviour change, stated plainly:** an action rendered by one of these four
that declares `objectName` now acts on that object. An action whose
`objectName` names the page's own object, and an action that declares none,
behave exactly as before.

**`onClick`.** The UI-local escape hatch on `UIActionSchema` is documented to
take precedence over `type` / `target`, and `action:menu` has always honoured it
by calling it directly and skipping the action runner. The other three neither
called nor forwarded it, so an `onClick` supplied from code did nothing on them.
They now call it the same way, so the same action behaves the same whether it
renders inline or in the overflow menu. `onClick` is a function and cannot be
written in metadata, so only code-composed schemas are affected.
