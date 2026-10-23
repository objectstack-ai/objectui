---
'@object-ui/app-shell': minor
'@object-ui/data-objectstack': minor
---

Setup → Positions now says who holds each position and which permission sets it grants, and a click anywhere on a row opens the item (objectstack#25333).

- **Two columns, both the server's.** The position list reads `GET /meta/position?include=grants`. **Holders** shows the served `_holderCount`, and **Permission sets** shows the served `_grantedPermissionSets` in the order the server sends them. The server computes both where the authorization resolver enforces them, and the console computes neither.
- **The set a position grants by its name is shown, marked "(by name)".** That set shares the position's name, and the position-name fold grants it even though the definition does not list it (objectstack#24757). A tooltip says why it is there. Sets the definition lists carry no mark.
- **A count nobody measured is "—", never 0.** That covers a count the server did not serve (`null`: no active organization, or a caller who may not read position assignments) and a server that predates `include=grants`.
- **The whole row opens the item** on every Setup metadata list, as a record list's row does. The first cell keeps its link for the keyboard, screen readers and opening in a new tab. A click on a control in the row (the Active switch, Clone, a link) is still that control's. A modified click, a click that ends a text selection, and a click inside a dialog a row control opened do not open the row.
- **`@object-ui/data-objectstack`**: `MetadataClient.list` / `listResponse` accept `include: 'grants'`, sent as the `include` query parameter.
