---
---

`.claude/settings.json` and `AGENTS.md` only — no released package source and no published
contract field is touched, so this declares **no release** with an empty frontmatter rather
than a bump. `node scripts/check-changeset-presence.mjs` agrees on its own terms ("no changeset
is owed"); the declaration is written anyway because the rule asks for a declaration once, not
for a release.

objectui#9418 ports the two write-identity locks objectstack landed in objectstack#18072:

1. `permissions.deny` names the 14 content-writing MCP GitHub tools, so every seat and dev
   write leaves through the REST proxy authored `claude[bot]` instead of a person's linked
   GitHub account. A suspended user account hides everything it authored — that is what this
   closes, and it is measured, not hypothetical. The four state-shaped tools
   (`update_pull_request`, `enable_pr_auto_merge`, `actions_run_trigger`,
   `resolve_review_thread`) stay allowed: they author no content and the landing path needs them.

2. §9's governed-surface paragraph stated the landing action as a human merge. Under the
   maintainer's ruling C a governed hit stays draft until an authorized APPROVED review exists
   (`GOVERNED_APPROVERS`: os-zhuang / hotlong, latest-decisive, not dismissed), and the claiming
   seat then lands it. The hard rule is restated in objectstack `lanes/ui.md`'s own words — a
   rules-layer paragraph is not paraphrased — and the four other lines that named a human merge
   get the minimal word change so the paragraph does not contradict itself. The fifth
   prohibition (a seat never approves) and the verbatim maintainer quotes are untouched.
