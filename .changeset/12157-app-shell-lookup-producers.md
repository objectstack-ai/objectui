---
'@object-ui/app-shell': patch
---

Two producers hand the `lookup` widget `@objectstack/spec`'s spellings, moving with the widget's own retirement of the snake_case reads (objectui#12157):

- `paramToField`, behind the action-param dialog, emits `lookupColumns` / `lookupPageSize` in place of `lookup_columns` / `lookup_page_size`.
- The flow designer's directory record-lookup cell opts out of quick-create with `allowCreate: false` in place of `allow_create: false`.

An action param's declared picker columns and page size, and the flow picker's quick-create opt-out, keep working: the widget reads only the camelCase keys now, and each emit moved with its reader.
