---
---

Renumber the `## N.` sections of `.github/prompts/ui-library.prompt.md` so they run
`1, 2, 3, 4` instead of `1, 3, 4, 5` (objectui#9319). Instruction files only; no package is
released by this change.

**`## 2` was never written — it was not deleted.** The file has exactly one commit in its
entire history, `4e7737788` ("refactor: remove outdated prompts and add new component
development context"), and there it is a pure creation: `new file mode`, `@@ -0,0 +1,66 @@`,
zero deletion lines. The headings read `1, 3, 4, 5` in that first commit and have never read
anything else. A pickaxe for a `## 2` heading over the whole path across every ref returns no
commit at all, while the same pickaxe for `## 3` returns that creating commit — so the search
would have found a deletion had one happened. Nor is the file a condensation of one of the 17
prompt files that same commit deleted: none of them contained the phrase "Core Philosophy",
in a run where a control phrase ("Shadcn") hit nine of them.

So the gap records nothing absent. There is no section 2 to restore and none is added — the
same finding, and the same repair, that objectui#9145 reached for this file family's letter
runs: "It was not dropped... there is no `C` category to restore." The two sibling prompts
born in that same commit are numbered contiguously (`component.prompt.md` `0`–`4`,
`engine.prompt.md` `1`–`7`); only this file skipped, which is what a hand-numbering slip
looks like.

Nothing cites these numbers, measured three ways, each against a control that hit: the five
`§` cross-references in `.github/prompts/**` all point at `component.prompt.md` (`§2.A`,
`§B`, `§E`) and none at this file; no tracked text contains any of its heading anchor slugs
(`#3-component-standards` and its siblings), in a run where `#development-workflow` hit two
files; and no tracked text pairs "ui-library" with a section reference. `check:prompt-keys`
parses this file's four `## N.` sections and validates the `### A./B./C.` run under
Component Standards, but it uses the section number only as a label and, by objectui#9145's
explicit scoping, "the `## N.` numbers themselves are a different claim and are not judged" —
so the renumbering moves no assertion. Only the four heading lines changed; the file's seven
numbered list items are untouched.
