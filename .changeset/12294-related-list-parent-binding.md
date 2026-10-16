---
'@object-ui/plugin-detail': minor
'@object-ui/types': minor
'@object-ui/cli': minor
---

`record:related_list` reads its parent record from `parentDataSource` (objectui#12294, ruling B on objectui#12296). The key is a member of the spec's `record:related_list` row and takes the object binding `dataSource` takes, so a product `app` page can list a record's children with no record page around the block:

```json
{
  "type": "record:related_list",
  "properties": {
    "objectName": "sys_member",
    "relationshipField": "environment_id",
    "parentDataSource": {
      "object": "sys_environment",
      "filter": [{ "field": "environment_type", "operator": "equals", "value": "production" }],
      "limit": 1
    }
  }
}
```

- **The parent is read the way the other record blocks read their record.** The FIRST row of the binding by its `sort` is the parent, read as one row under the caller's own identity and re-read when a write to its object is announced. The list draws that record's children through `relationshipField`, and `relationshipValueField` is read on that row.
- **No row is said out loud.** When no row matches, or the server refuses the read, the block draws a notice naming the object in its place, and no list: an empty list would read as "this record has no related records". A read that fails any other way draws the data-source error panel.
- **Without the key, the parent is the record page's record, as before**, and a related list rendered on a record page draws the same markup it drew. With the key, the binding wins over the page record.
- **`dataSource` keeps its meaning.** On this block it binds the CHILD rows the list draws, and it is never read as the parent.
- **Authoring.** `RecordRelatedListComponentProps` declares `parentDataSource` as the spec's `ElementDataSource`, by reference, and the registration publishes it as an input, so the html tier no longer reports it as an unknown prop. `objectui validate` already accepted it in `properties`, where the spec row puts it, and refuses it written on the node; it now also warns on a parent binding without `limit: 1`, as it warns on the one-record blocks' bindings.
