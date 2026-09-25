---
---

`.claude/settings.json` only — no released package source and no published contract field is
touched, so this declares **no release** with an empty frontmatter rather than a bump. The
declaration is written anyway because this repo's rule asks for a declaration once, not for a
release; `node scripts/check-changeset-presence.mjs` agrees on its own terms.

objectui#9586 mirrors the enqueue-class lock objectstack landed in objectstack#18317, and the
one earlier entry this repo had also never received (objectstack#18276):

- `permissions.deny` gains `mcp__github__enable_pr_auto_merge` and
  `mcp__github__disable_pr_auto_merge` (the enqueue class, ruled closed on objectstack#18282)
  plus `mcp__github__update_pull_request`, which arms a pull request's landing as a hidden side
  effect of an unrelated field — the mechanism behind objectui#6183, where a governed draft
  entered the merge queue and landed with no human approval.
- Nothing is lost by denying them: the only enqueue route either board actually uses is the
  REST proxy's `PUT .../pulls/{n}/ccr/auto_merge`, which is already an `allow` entry in this
  same file, and `gh pr ready` / `gh pr merge --auto` are untouched.
- The result is that this repo's deny array is now element-for-element identical to
  objectstack's, order included — declared = enforced on both boards from one reading.
