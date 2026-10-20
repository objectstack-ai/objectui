---
'@object-ui/app-shell': patch
---

Studio's copilot draft marks, the remainder (objectui#12725):

- **The Access pillar's permission edits are recorded as `studio`.** The permission matrix's draft save sends `surface: 'studio'` when Studio's Access pillar hosts it. The same editor under metadata-admin (environment scope) states no surface.
- **The copilot's element marks sit inside the widget rows.** In an `object` leaf's list-view properties, a card field (`kanban.columns`) or a column (`columns`) the AI copilot added carries the Draft chip in its own row of the card-field picker or the column list, instead of in a list under the widget. A copilot change to `columns` that added no column keeps the chip beside the setting.
