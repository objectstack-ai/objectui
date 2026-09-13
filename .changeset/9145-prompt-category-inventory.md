---
---

Repair the category inventory in `.github/prompts/component.prompt.md`, and pin the letter
runs so the same gap cannot reopen (objectui#9145). Tooling and instruction files only; no
package is released by this change.

§1 Component Categories described itself twice and was wrong both times: it opened with a
hand-written "these **3** standard slots" over **seven** sections, and those seven ran
`A B D E F G H` — no `### C.`. To an AI author that reads this file as authoritative, a
missing letter says *a section was dropped*, and nothing in the file said whether that was
true.

**It was not dropped.** Both halves were wrong in the file's own first commit,
`4e7737788` ("refactor: remove outdated prompts and add new component development
context"), and in each of the four commits that touched the file since: the letters have
read `A B D E F G H` and the sentence has read "3" for the file's entire history, over
seven sections throughout. So neither half drifted from a state that was once true — the
inventory was never measured against the list it describes, and there is no `C` category
to restore. The letters are renumbered `A`–`G`; no section is added.

The count is **deleted rather than corrected**: the sentence now reads "in the standard
slots below" and states no number at all, so the inventory is written down in exactly one
place and there is no second copy for it to disagree with.

The lettering cannot be deleted the same way — it *is* the inventory — so it is pinned
instead. `check:prompt-keys` now also reads every `### X.` heading in `.github/prompts/**`
and requires each `## N.` section's run to be contiguous from `A`. The run is scoped to its
`## N.` section because the surface carries eight independent runs that each restart at `A`
(`component.prompt.md` has a second one under §2, `engine.prompt.md` has five), so a
file-wide sequence check would red on every correct file. A section with no letter headings
contributes no run, and the `## N.` numbers themselves are a different claim and are not
judged. Run on this tree: 29 headings across 8 runs, all contiguous.

`engine.prompt.md`'s cross-reference to the Primitive Atoms section moved with it, `§F` to
`§E`, in the same commit.
