---
'@object-ui/app-shell': patch
'@object-ui/components': patch
'@object-ui/console': patch
---

The flow designer, canvas, Debug simulator and read-only flow viewer treat `http` as the HTTP node type, and no longer recognise `http_request`, `http_call` or `webhook` as node types (objectui#12742).

`@objectstack/spec` 18 reserves those three names inside the flow node namespace: the authoring doors refuse them with the rename to `http`, and a stored flow that still carries one loads as `http`.

- **Inspector.** A node typed `http` shows the HTTP form (Method, URL, Headers, Body, Timeout) offline, and its zh-CN field labels. The form is keyed `http`; no designer alias resolves a reserved name onto any form.
- **Canvas.** An `http` node draws the globe glyph on the integration tone. It used to fall back to the generic task glyph, because the icon switch named only `http_request` and `webhook`.
- **Debug simulator.** An `http` node is mocked, and the panel offers it a mock-output field. It used to pass through unmocked.
- **Flow viewer.** An `http` node is folded away as a technical step at business detail. It used to show as a business step.
- **Preview samples.** The two HTTP nodes in the flow preview sample are typed `http`, and the loop-body one no longer writes `outputVariable`, a key the `http` contract does not declare.

The zh-CN string `engine.flowNode.http_request.label` is removed; `engine.flowNode.http.label` already carries the same label. A wait node's `eventType: 'webhook'` is unchanged.
