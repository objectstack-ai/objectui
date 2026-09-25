---
'@object-ui/plugin-view': patch
---

`filter-ui`, `sort-ui` and `view-switcher` no longer crash when an authored
document sets their event-name key (`onChange`, or `onViewChange` on the
switcher).

These keys hold the NAME of a `CustomEvent` dispatched on `window`
(objectui#6124). `SchemaRenderer` also passes these keys through to the component
as React props, so the authored string reached the component's callback prop
of the same name. The component called that prop, so the first interaction
threw `TypeError: onChange is not a function` (or `onViewChange`) and the event
was never dispatched. This form rendered through `SchemaRenderer` crashed:

```json
{ "type": "sort-ui", "fields": [{ "field": "name" }], "onChange": "myapp:sort-changed" }
```

The three controls now call the prop only when it is a function, and dispatch
the event named on the schema. The listener below receives `e.detail.sort`
(`e.detail.values` for `filter-ui`, `e.detail.view` for `view-switcher`):

```js
window.addEventListener('myapp:sort-changed', (e) => e.detail.sort);
```

A React host that passes a function through `SchemaRenderer` is unaffected.
Its function is called first with the new value. The authored event, if one is
named, is then dispatched as before.
