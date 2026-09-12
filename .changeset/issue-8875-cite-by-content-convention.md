---
---

`AGENTS.md` only — no released package source is touched, so this declares **no release** with
an empty frontmatter rather than a bump. A `patch` here would version-bump the whole 39-package
fixed group for a change no consumer can observe.

objectui#8875 clause 1: adds Coding Standard **#10 — cite by CONTENT, not by line address**, the
human-facing convention behind the differential gate that landed in objectui#8974. objectui#7853
ruled the class; objectui#8047 mechanized it for test names only, exempting comments and failure
messages because "a human reads them beside the code they annotate". #10 records the point that
justification is positional: it holds for a same-file citation and does not survive the citation
crossing a file boundary, where nothing puts the cited line in front of the reader and nothing
tells them it moved.
