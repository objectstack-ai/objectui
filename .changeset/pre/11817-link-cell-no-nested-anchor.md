---
'@object-ui/plugin-grid': patch
---

A grid's link cell (the first column, or a column authored `link: true`) no longer draws an anchor inside its anchor to the record (objectui#11817).

The Invitations list in Setup, whose first column is the invitee's email, nested the email's `mailto:` link and its copy button inside the row's record link: an anchor inside an anchor, which React reports as invalid HTML.

Inside a link cell, an email, URL, phone number or file (`file`, `video`, `audio`) is now drawn as its text, so the cell is one link to the record; a reference (`lookup`, `master_detail`, `tree`) is drawn as its name rather than as a second link to the referenced record. Every other column keeps its own links, copy buttons and download links as before.
