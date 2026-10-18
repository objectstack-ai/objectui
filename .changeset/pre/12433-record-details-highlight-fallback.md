---
"@object-ui/plugin-detail": patch
---

A `record:details` node with neither `sections` nor `fields` now draws the object's `highlightFields` (objectui#12433).

`@objectstack/spec` declares this fallback on `RecordDetailsProps` ("omitting it falls back to the object's `highlightFields`"), and the block's own registry inputs said the same, but the renderer drew an empty body. objectstack's served `sys_approval_request_detail` page uses a bare `record:details` for its Details tab, so that tab was empty for every approver; it now shows the request's target record (`record_id`), the one highlight field the page's strip leaves to the body.

- The fallback list is the object's `highlightFields`, in declared order. It takes the same path an authored `fields` list takes: `enforceFieldSecurity` and `redactFields` apply, and a field already shown by a mounted `record:highlights` strip or as the page title is not repeated.
- It runs only when the node authors neither key. An authored `sections` or `fields`, an empty one included, is the body exactly as before.
- A list the field-security fold empties stays empty; nothing is derived in its place.
- An object that declares no `highlightFields` still renders an empty body, as before: the spec names no further fallback.
