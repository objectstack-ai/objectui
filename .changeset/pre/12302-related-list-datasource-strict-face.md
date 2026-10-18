---
'@object-ui/types': minor
---

The strict authoring face accepts `dataSource` on `record:related_list` (objectui#12302). The block's renderer has honoured the spec's per-element binding since objectstack#6953: it lands the binding's `object` on `objectName`, and its `filter`, `sort` and `limit` (and a named `view`'s columns) on the list's own keys. `objectui validate` refused the key as undeclared all the same, so it told an author that a binding the console honours does not exist.

```json
{
  "type": "record:related_list",
  "properties": { "objectName": "sys_member", "relationshipField": "organization_id" },
  "dataSource": { "object": "sys_member", "sort": [{ "field": "created_at", "order": "desc" }], "limit": 5 }
}
```

- **`RecordRelatedListBlockSchema` declares `dataSource`** as the spec's `ElementDataSourceSchema`, by reference, as `record:line_items` does. The TypeScript authoring face (`PublicBlockNode`) carries it on `record:related_list` by derivation.
- **The binding binds the CHILD rows the list shows, not the parent record.** The parent is still the record the block sits on, matched through `relationshipField`. The member is not the one the three one-record blocks (`record:details`, `record:highlights`, `record:quick_actions`) declare: there the first bound row becomes the block's record.
- **`objectui validate` stays quiet about it.** Its `limit: 1` warning is for the one-record blocks; a related list's rows are many by design.
- **The binding's value is the spec's verdict.** A binding the spec refuses (a bare string, `limit: 0`, no `object`) is refused at `dataSource`, as on every arm that declares the binding.
