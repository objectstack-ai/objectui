---
'@object-ui/app-shell': minor
---

Switch the `sharing_rule` client validator ON at the Studio **edit** door
(objectui#7612).

Editing a sharing rule now gets the same live, in-editor validation the create
door has always had: an `accessLevel` outside the declared enum, a mistyped key
or a malformed `sharedWith` is named in the diagnostics banner and on the field
as you type, instead of arriving as a server refusal on Save. The edit door was
the one door on this type with no client gate at all, and it is where a
permissive sharing condition gets written into an existing rule.

**Why this could not ship earlier, and what changed.** `SharingRuleSchema` is
`.strict()`, and the metadata read path stamps its own `_diagnostics` onto every
served item — a key the spec deliberately does not allowlist, because a served
body is not valid input to the schema that produced it until the read-time
decorations come off. A gate switched on before that ingress closed would have
reported bodies the server accepts as broken, for any rule with a pending draft.
The ingress was closed upstream, at the one function that turns a served draft
envelope into a body, reading the spec's own exported decoration list; this
release only opens the door that was waiting on it.

**Not** a loosened schema. The gate is exactly as strict as it was: a raw
decorated body is still refused, and the pins assert that in both directions, so
a regression in the strip fails here rather than in front of an author.
