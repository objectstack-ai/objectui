---
'@object-ui/app-shell': patch
---

fix(app-shell): a published html page that gains a plugin component can be published again from the metadata editor

The metadata editor (`MetadataResourceEditPage`) seeds a page's draft from the
served document, and that document carries the `requires` list the server
stamped from the page's source. A save sent the old list back as if the author
had written it. Once a source edit added a plugin component (a Kanban from
`plugin-kanban`, say), the draft saved but the publish was refused
(`422 INVALID_METADATA`, rule `page-requires-disagrees-with-source`). The
refusal named a key the editor never shows.

The `page` resource now leaves `requires` out of the body it saves, so the
server stamps it from the source on every save. The editor does not compute
`requires` itself. The server still refuses a hand-written list that disagrees
with the source.

Scope: this covers the metadata editor's save, autosave and ⌘S. The Studio
Interfaces pillar saves a page through its own path, which this change does not
touch.
