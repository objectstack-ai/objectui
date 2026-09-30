---
'@object-ui/app-shell': patch
---

fix(app-shell): the marketplace offers an "update" only for a HIGHER version (objectui#10899)

The environment marketplace detail page decided "update available" — the amber
`Update available → vX` badge, the primary button's `Update` label, and the
install dialog's per-environment `Update → vX` hint — by comparing the installed
version with the latest approved one using `!==`. An environment holding a newer
version than the latest approved one (a draft installed ahead of review) was
therefore told `Installed v1.1.0 · Update available → v1.0.0`, and the button
offered to "update" it to the older version.

Both call sites now ask `isNewerVersion`, which orders the two by SemVer 2.0.0
precedence — the grammar the package manifest contract declares for `version`.
Only a version of higher precedence is an update; an equal, older or
non-SemVer pair offers none, so the page never guesses an order the contract did
not give it.
