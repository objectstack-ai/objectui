---
'@object-ui/app-shell': patch
---

The `ConditionBuilder` raw CEL editor stops advertising roots the mount's host never
binds (objectui#9645).

objectui#8167 made this editor LINT in the scope its mount evaluates in. Its
autocomplete did not follow: the mount forwarded no `roots` override, so it offered
whatever the engine advertises at that scope — every root ANY predicate site may see.
On a hook `condition` that is a trap rather than noise. objectstack's hook wrapper
evaluates the stored condition against `{ record, previous }` and throws
`HookConditionError` on an unevaluable one (objectstack#4775, fail-LOUD on purpose), so
an author who accepted the editor's own `os.user.id` suggestion got a green lint — the
accept set is the engine's `SCOPE_ROOTS`, which carries `os` / `current_user` / `vars`
at this scope — and a runtime refusal on their write.

A mount that declares `scope="record"` now advertises `RECORD_CONDITION_ROOTS`
(`record`, `previous`) — the roots every host of a record-scoped condition binds — and
a mount that binds more declares them through the new `roots` prop, the shape
`ObjectFieldInspector` and `ConditionalFormattingEditor` already use for their own
surfaces. A mount that declares no `scope` is unchanged: it forwards `undefined` and
keeps the engine's own advertisement.

**Suggestions only.** The accept set is untouched — `roots` feeds autocomplete, not the
linter — so every spelling that linted clean before still lints clean, and the server's
binding is not loosened. The visible effect is that `os` / `current_user` / `user` /
`input` / `vars` are no longer OFFERED at a record-scoped mount of this builder. For the
client-evaluated mounts (an action's `visible` / `disabled`), whose host evaluator does
bind `os` / `user` / `current_user`, that is a lost offer rather than a lost spelling,
and it is restored by declaring `roots` at that mount.
