---
'@object-ui/plugin-detail': minor
---

`record:related_list` now renders the actions its `actions` key names (objectui#11163; ENFORCE ruling on objectstack#20665).

The contract has declared `actions` ("Action IDs available for related records") on this block, and the registration has published it, but no renderer read it: a related list always drew the host's actions for its child object, whatever the page said. The key is read now, and it composes with the host like this:

- **Absent** — unchanged. The host bridge's actions render as before: the child object's `list_toolbar` actions as header buttons and its `list_item` actions in each row's menu. No extra metadata request is made.
- **Authored** — the authored list is what renders, in authored order. Each id is the `name` of an action on the related object's own `actions`, resolved through the same metadata lookup `record:quick_actions.actionNames` uses, and placed by that action's own `locations` (`list_toolbar` → header button, `list_item` → row menu). The host still runs it.
- **`[]`** — no actions. The built-in New / Edit / Delete / View affordances are not action ids and are unaffected.
- **Refused** — an id that names no action of the related object, one whose action declares neither `list_toolbar` nor `list_item`, and an array that is not all action ids are named in a `role="status"` notice on the list instead of being dropped. The entries that do resolve still render.

⚠️ Behaviour change for pages that already author `actions` on a related list: those lists used to ignore the key and now show exactly the named actions.
