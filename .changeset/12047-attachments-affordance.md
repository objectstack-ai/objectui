---
'@object-ui/app-shell': patch
---

The record Attachments panel offers Upload and delete only to a caller whose `sys_attachment` grant allows them (objectui#12047).

Upload and delete used to render for every caller, and the panel learned about a missing grant
only from the server's refusal. A caller who could read a record's attachments but not create
one picked a file, the upload stored it, and only then was the attach refused: the error came
after the file was already uploaded, and that file stayed behind with nothing attached to it.

Upload now shows only with the create grant on `sys_attachment`, and delete only with the delete
grant. Being the uploader does not open delete without that grant, because the server checks the
grant before it applies its uploader-or-record-editor rule. The grant comes from the permissions
the console already loads, so the panel makes no new request and the buttons never appear and then
vanish while permissions load. The server's refusal messages stay in place for a grant that changes
after the page renders and for a record the caller may not edit.
