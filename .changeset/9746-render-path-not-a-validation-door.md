---
---

Document that the render path is not a validation door (objectui#9746).

`content/docs/guide/schema-rendering.md` gains a "Render is not a validation door" section:
`SchemaRenderer` never parses a document against the published Zod schema, the one document
check on the render path is `@object-ui/core`'s hand-written structural walker, and that call
sits behind a development-only guard — so a production build validates nothing before it draws.
At this change the section named three doors that do validate (the framework's load-time Zod
parse, surfaced as the `_diagnostics` envelope the Metadata Diagnostics guide describes;
`objectui validate` / `objectui check`; and `safeValidateSchema` from `@object-ui/types/zod`)
and stated that the walker and the schema do not share an accept set, so neither verdict stands
in for the other. `SchemaRenderer.tsx` gains one comment line beside that guard pointing at the
section.

⚠️ **Dated note, 2026-09-25 — `objectui check` is not a validation door — objectui#10524.**
Later in this same release objectui#10416 corrected the section: its second door is now
`objectui validate` alone, and it says what `objectui check` does instead. `check` is an
advisory sweep: it never parses against the schema a file whose root carries a structural key (`children`,
`className`, `body`, …), it lists a file with none of those keys by name when the file does not
validate, and it exits non-zero on unreadable JSON only.

Ruled on objectui#9746 (letter B, 2026-09-18): the render path stays exactly as it is and is
*declared* so. No code path changes and the dev-only walker is untouched.

Empty front matter — no release, and this is the level the change actually earns: the only edit
to published source is a comment, which no build emits (the comment-stripped file is
byte-identical before and after), and `content/` sits outside every package, so it appears in no
published `files` list. No runtime behaviour, export, type or manifest field moves.
