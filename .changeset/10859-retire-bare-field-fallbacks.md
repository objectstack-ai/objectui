---
'@object-ui/fields': minor
---

refactor(fields)!: the 28 field widgets that still registered a bare node-type fallback register `field:<type>` only (objectui#10859, batch 8)

**BREAKING (authoring):** `registerAllFields()` no longer registers the bare keys `auto_number`, `boolean`, `checkboxes`, `color`, `currency`, `date`, `datetime`, `file`, `formula`, `geolocation`, `location`, `lookup`, `master_detail`, `multiselect`, `number`, `object`, `percent`, `phone`, `qrcode`, `radio`, `rating`, `richtext`, `signature`, `summary`, `tags`, `url`, `user` and `vector`. Every field widget is registered under its `field:<type>` key alone — the key a form resolves, and the only one it ever resolved (ruling B of objectui#5254). Each of these bare keys was a node `type` that `objectui validate` refused at `type`, and nothing in this repository authored one as a node: every catalog entry and doc example writes these values as a FIELD type inside `fields[]` / `columns[]`, which is unaffected. A node authored with one of them now renders the "Unknown component type" panel, and `objectui check` reports the type as unknown.

Migration, one line per retired spelling:

- `{ "type": "auto_number" }` as a node → a field `{ "name": "…", "type": "auto_number" }` in a form's `fields[]` (rendered by `field:auto_number`).
- `{ "type": "boolean" }` as a node → a field `{ "name": "…", "type": "boolean" }` in a form's `fields[]` (rendered by `field:boolean`).
- `{ "type": "checkboxes" }` as a node → a field `{ "name": "…", "type": "checkboxes" }` in a form's `fields[]` (rendered by `field:checkboxes`).
- `{ "type": "color" }` as a node → a field `{ "name": "…", "type": "color" }` in a form's `fields[]` (rendered by `field:color`).
- `{ "type": "currency" }` as a node → a field `{ "name": "…", "type": "currency" }` in a form's `fields[]` (rendered by `field:currency`).
- `{ "type": "date" }` as a node → a field `{ "name": "…", "type": "date" }` in a form's `fields[]` (rendered by `field:date`).
- `{ "type": "datetime" }` as a node → a field `{ "name": "…", "type": "datetime" }` in a form's `fields[]` (rendered by `field:datetime`).
- `{ "type": "file" }` as a node → a field `{ "name": "…", "type": "file" }` in a form's `fields[]` (rendered by `field:file`).
- `{ "type": "formula" }` as a node → a field `{ "name": "…", "type": "formula" }` in a form's `fields[]` (rendered by `field:formula`).
- `{ "type": "geolocation" }` as a node → a field `{ "name": "…", "type": "geolocation" }` in a form's `fields[]` (rendered by `field:geolocation`).
- `{ "type": "location" }` as a node → a field `{ "name": "…", "type": "location" }` in a form's `fields[]` (rendered by `field:location`).
- `{ "type": "lookup" }` as a node → a field `{ "name": "…", "type": "lookup" }` in a form's `fields[]` (rendered by `field:lookup`).
- `{ "type": "master_detail" }` as a node → a field `{ "name": "…", "type": "master_detail" }` in a form's `fields[]` (rendered by `field:master_detail`).
- `{ "type": "multiselect" }` as a node → a field `{ "name": "…", "type": "multiselect" }` in a form's `fields[]` (rendered by `field:multiselect`).
- `{ "type": "number" }` as a node → a field `{ "name": "…", "type": "number" }` in a form's `fields[]` (rendered by `field:number`).
- `{ "type": "object" }` as a node → a field `{ "name": "…", "type": "object" }` in a form's `fields[]` (rendered by `field:object`).
- `{ "type": "percent" }` as a node → a field `{ "name": "…", "type": "percent" }` in a form's `fields[]` (rendered by `field:percent`).
- `{ "type": "phone" }` as a node → a field `{ "name": "…", "type": "phone" }` in a form's `fields[]` (rendered by `field:phone`).
- `{ "type": "qrcode" }` as a node → a field `{ "name": "…", "type": "qrcode" }` in a form's `fields[]` (rendered by `field:qrcode`).
- `{ "type": "radio" }` as a node → a field `{ "name": "…", "type": "radio" }` in a form's `fields[]` (rendered by `field:radio`).
- `{ "type": "rating" }` as a node → a field `{ "name": "…", "type": "rating" }` in a form's `fields[]` (rendered by `field:rating`).
- `{ "type": "richtext" }` as a node → a field `{ "name": "…", "type": "richtext" }` in a form's `fields[]` (rendered by `field:richtext`).
- `{ "type": "signature" }` as a node → a field `{ "name": "…", "type": "signature" }` in a form's `fields[]` (rendered by `field:signature`).
- `{ "type": "summary" }` as a node → a field `{ "name": "…", "type": "summary" }` in a form's `fields[]` (rendered by `field:summary`).
- `{ "type": "tags" }` as a node → a field `{ "name": "…", "type": "tags" }` in a form's `fields[]` (rendered by `field:tags`).
- `{ "type": "url" }` as a node → a field `{ "name": "…", "type": "url" }` in a form's `fields[]` (rendered by `field:url`).
- `{ "type": "user" }` as a node → a field `{ "name": "…", "type": "user" }` in a form's `fields[]` (rendered by `field:user`).
- `{ "type": "vector" }` as a node → a field `{ "name": "…", "type": "vector" }` in a form's `fields[]` (rendered by `field:vector`).

A host that rendered a field widget outside a form addresses it as `field:<type>`, or uses `getLazyFieldWidget(<type>)`, which never went through the bare key.

**Clause-②: yes** — a registration leaves the runtime (narrowing), released as `minor` under the objectui narrowing rule, with this banner.
