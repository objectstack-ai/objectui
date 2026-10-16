---
'@object-ui/components': minor
---

`action:group` and `action:menu` no longer read a member's `properties.params` (objectui#11638). A container member's `properties.params` no longer reaches the action runner.

**Why.** `@objectstack/spec` refuses a `properties` key on an `action:group` / `action:menu` member, with this prescription: "A member carries no `properties` bag: its static parameter values (`properties.params`) are not part of the inline action vocabulary. For a `type: 'api'` member's request body write `bodyExtra`; to run an action with static parameter values, author it as its own `action:button` node, whose `params` object carries them." The census behind that ruling found no writer of the key. The renderers kept a read the spec refuses, so the read is retired.

**Behaviour change**, shipped as `minor` per this repository's version policy:

- A member's `properties.params` is not forwarded as the runner's `params`, and it is no longer template-evaluated. This holds for an `action:group` member (inline and dropdown), an `action:menu` item, and an `action:bar` member that lands in the overflow menu.
- A member whose `params` is an array forwards it as `actionParams` alone. The runner's `params` then carries only what the user answers in the parameter dialog.
- A `type: 'api'` member's object `params` is its request payload (the objectstack#5777 window), and a `properties.params` beside it no longer replaces that payload.
- Unchanged: an `action:button` / `action:icon` node reads its static values from `properties.params` as before, and so does an `action:bar` member drawn inline, which the bar mounts on one of those two renderers.

**FROM** a container member carrying static values:

```json
{ "type": "action:group", "actions": [
  { "name": "edit", "label": "Edit", "type": "navigate_edit", "properties": { "params": { "recordId": "${record.id}" } } }
] }
```

**TO** its own `action:button` node:

```json
{ "type": "action:button", "properties": { "label": "Edit", "actionType": "navigate_edit", "params": { "recordId": "${record.id}" } } }
```

For a `type: 'api'` member's request body, write `bodyExtra` on the member.

**Clause-②: no.** No export, prop, type member or i18n key is added or removed. The retired helper lived in a module that `@object-ui/components` does not re-export from its entry.
