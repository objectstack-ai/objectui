---
---

`AGENTS.md` only — no released package source is touched, so this declares **no release** with
an empty frontmatter rather than a bump. A `patch` here would version-bump the whole 39-package
fixed group for a change no consumer can observe.

objectui#9198: adds one habit line to the workflows discipline, beside the `git cat-file -e` probes
that answer "does this repo run this workflow". Before a `.github/workflows` file is edited, the
tests that read it are DERIVED with a `git grep` over test paths and every hit is run locally,
instead of being recalled from memory by name similarity to the workflow. The round that motivated
it listed six pins by name and missed the one that went red, because that pin is not named after
any workflow.

The line states its own limit rather than leaving it to be assumed: the text search is wrong in
both directions, and the readers it cannot see — directory enumeration, a shared helper doing the
read, a gate script walking the tree — are recorded on objectui#9198, not covered by the habit.
The director seat's ruling on that card declines to build a collector or a gate for them; the one
incident this habit exists to prevent is inside the search's hits.
