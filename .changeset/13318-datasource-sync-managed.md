---
'@object-ui/app-shell': patch
---

Setup → Datasources offers "Sync objects" only on a datasource that can be synced (objectui#13318).

The server refuses every Sync step (listing remote tables, drafting and importing an object) on a datasource whose schema mode is `managed`, with a `400` that names the rule and the remedy. A datasource saved without a schema mode is managed too, and so is the platform's `default` datasource. The page still showed the button on every row, so on such a row it opened a dialog that could only show the refusal.

The button now shows only on a row whose schema mode is `external` or `validate-only`, and never on the `default` row. To sync from a managed datasource, edit it and set its Schema mode to External or Validate only.
