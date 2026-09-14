---
---

Watch the merge queue's required-check set (objectui#9422). A daily patrol reads
`GET /repos/{owner}/{repo}/rules/branches/{branch}` and fails when `Type Check` —
the leg the 2026-08-07 incident actually failed on — is no longer required, or
when the `merge_queue` / `required_status_checks` rules are gone. Tooling and CI
only; no package is released by this change.
