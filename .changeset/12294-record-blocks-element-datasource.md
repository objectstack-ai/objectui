---
'@object-ui/plugin-detail': minor
'@object-ui/types': minor
'@object-ui/cli': minor
---

`record:details`, `record:highlights` and `record:quick_actions` honour the per-element `dataSource` binding the spec already declares on every page component (objectui#12294). A product `app` page can now compose a record's surfaces from these blocks, with no record page around them:

```json
{
  "type": "record:highlights",
  "properties": { "fields": ["name", "environment_type"] },
  "dataSource": {
    "object": "sys_environment",
    "filter": [{ "field": "environment_type", "operator": "equals", "value": "production" }],
    "limit": 1
  }
}
```

- **One record per block.** A record block shows the FIRST row of the bound set by the binding's `sort`, read as one row and under the caller's own identity; the server decides what the caller may read, exactly as on any other read. When no row matches, each block draws what it draws for a record that is not there: `record:details` its "record not found" state, `record:highlights` nothing, `record:quick_actions` its empty bar. A read the server refuses draws the same, so a record the caller may not read looks absent. A read that fails for any other reason is reported in the block's place, with the family's data-source error panel.
- **`record:quick_actions` runs against the bound row.** The object's declared actions (`actionNames`) run with the bound row's id.
- **The binding resolves as on every bound block.** A named `view`, the binding's `filter` (with `{current_user_id}`-style tokens), and its `sort` mean what they mean on a list block, and an unresolvable view or a refused filter draws the same configuration panel. Reference fields come back expanded, limited to the fields the caller may read, as on the record page.
- **The bound record stays fresh.** It re-reads in place whenever a write to its object is announced — by the data source's mutation events or on the data-invalidation bus — so a save or an action elsewhere on the page refreshes it.
- **The record page is unchanged.** A block with no `dataSource` reads the record page's record exactly as before. A bound block placed on a record page shows its bound record instead, as the spec says the binding does, and is kept out of that page's inline-edit session and highlight-field registry: it is read-only there, and it does not hide fields from the page record's details.
- **The registrations declare the key.** The three blocks publish the injected `dataSource` input, so the page authoring diagnostics no longer report it as an unknown prop.
- **`@object-ui/types`: the strict authoring face accepts the binding on the three blocks.** Each arm declares `dataSource` as the spec's `ElementDataSourceSchema`, by reference, as `record:line_items` does; the TypeScript authoring face follows. `objectui validate` refused it as an undeclared key before.
- **`@object-ui/cli`: `objectui validate` warns on a record block whose binding has no `limit: 1`.** The document still validates; the warning names the block's path and asks the author to say which record the block shows. `record:related_list` is not warned about: its binding is the binding of its child rows.

`record:related_list` is unchanged: its `dataSource` still binds the rows it lists.
