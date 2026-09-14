---
---

Correct `.changeset/README.md` and `CONTRIBUTING.md` to identify the Changesets
release PR by its head branch, `changeset-release/main`, instead of by a
`"Version Packages"` title this repository's bot has never produced
(objectui#9134). The head branch is the action's own convention; the title is the
`title:` input passed in `.github/workflows/changeset-release.yml` and is
repository-local. Documentation only; no package is released by this change.
