---
'@object-ui/app-shell': patch
---

fix(app-shell): a published html page that gains a plugin component can be published again from the Studio

Two editors save a page: the metadata editor (`MetadataResourceEditPage`) and
the Studio Interfaces pillar. Both seed their draft from the served document,
and that document carries the `requires` list the server stamped from the
page's source. A save sent the old list back as if the author had written it.
Once a source edit added a plugin component (a Kanban from `plugin-kanban`,
say), the draft saved but the publish was refused (`422 INVALID_METADATA`, rule
`page-requires-disagrees-with-source`). The refusal named a key neither editor
shows.

The `page` resource now leaves `requires` out of the body it saves, and both
editors save a page through it, so the server stamps the list from the source
on every save. Neither editor computes `requires` itself. The server still
refuses a hand-written list that disagrees with the source.
