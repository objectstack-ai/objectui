---
'@object-ui/plugin-list': minor
---

A page `list-view` node is written in `@objectstack/spec`'s list view spelling, `data` and `type`, and a metadata page reads `properties.type` as the list kind (objectstack-ai/objectstack#22444, ruling C; objectui#12099).

- The `list-view` and `view:list` registrations publish `data` (the spec's `ViewData`, `{ provider: 'object', object }` naming the object) and `type` (the list kind) in place of `objectName` and `viewType`, in their `inputs` and in `list-view`'s `defaultProps`. Neither input is required: a `dataSource` binding can name the object, and an absent kind is a grid unless a bound saved view supplies one.
- On a metadata page, `{ "type": "list-view", "properties": { "data": { "provider": "object", "object": "deal" }, "type": "kanban", "kanban": { … } } }` now draws a kanban over `deal`. Before, the page renderer never copied `properties.type` onto the node (the node's own `type` is the registry key), so every such list drew a grid. The node's own `type` stays `list-view`. A kind the node states outranks a bound saved view's kind.
- **Breaking for page nodes in the old spelling:** a page node's own `objectName` and `viewType` are no longer read. Each logs one console warning naming what to write instead, and a node that names its object only as `objectName` draws the "no object named" hint, which now names `data.object`. Converting stored page nodes is the platform's job (an ADR-0087 conversion in `@objectstack/spec`); the renderer does not read them back. `ListView`'s React props (`ListViewSchema`) are unchanged and still spell the two `objectName` and `viewType`.
