---
'@object-ui/app-shell': patch
---

fix(app-shell): the page designer stops offering the retired `page:header` breadcrumb toggle (objectui#11173)

The Studio page designer's properties panel offered a "Show breadcrumb" toggle on the
canonical `page:header` block, which wrote `breadcrumb` into the stored page. The
header renderer no longer reads that key (objectui#11166), and objectstack#20758
retires `PageHeaderProps.breadcrumb` in the spec through ADR-0087, after which the
platform refuses it by name. The toggle is gone from `BLOCK_CONFIG['page:header']`,
and its label key `engine.inspector.pageBlock.field.page:header.breadcrumb` left
both the en and zh tables, the same shape the header's `icon` field took.

A page that already carries `breadcrumb` is not rewritten by the designer: it opens,
the key shows under Advanced by its raw name, and the next save keeps it. The one
strip belongs to the spec's ADR-0087 conversion on load, with its notice.
