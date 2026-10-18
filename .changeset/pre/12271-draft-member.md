---
'@object-ui/app-shell': patch
---

Studio stops conflating two members of one bundle. The pending-changes sheet reads each draft's `member` off `GET /meta/_drafts` (objectstack#23073) and lists two languages of one `email_template` as two rows, each reading, diffing and classifying its own member through the by-name `/meta` doors' `?member=`; a draft without `member` sends no selector, as before. The build history names the member of each touched item that carries one.
