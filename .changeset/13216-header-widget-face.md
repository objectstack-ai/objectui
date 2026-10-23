---
'@object-ui/components': minor
'@object-ui/fields': patch
---

The record page heading draws a `nameField` that declares a widget with a read face of its own through that face, the one the field's list column draws (objectui#13216). A record share (`nameField: 'recipient_id'`, which declares `widget: 'recipient-picker'` and `dependsOn: ['recipient_type']`) now heads its page with the recipient's name instead of the user id it stores. Every other heading is unchanged: a plain text or select `nameField`, a `titleFormat`, an explicit `title`, an object with no `nameField`, a widget with no read face of its own, a widget whose key has no face registered under it (it draws the stored text), and a host that does not load `@object-ui/fields`.

`@object-ui/components` adds a field-face seam on its entry: `setFieldReadFaceResolver(resolver)` installs the resolver, `resolveFieldReadFace(field)` asks it, and the types `FieldReadFace`, `FieldReadFaceProps` and `FieldReadFaceResolver` describe them. `@object-ui/fields` fills it when it loads, with the same `getCellRenderer(resolveCellRendererType(field))` lookup the grid's cells make, so a host has nothing to wire. `RecordTitleChip` gains an optional `titleNode` prop, drawn inside its heading in place of the `title` text; `title` stays a required string.
