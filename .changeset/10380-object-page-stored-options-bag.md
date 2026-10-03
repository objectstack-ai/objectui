---
'@object-ui/app-shell': patch
---

A stored list view now renders the same on an interface page and on the object page when it carries a legacy `options` bag (objectui#10380).

`@objectstack/spec`'s flattened list view overlay accepts a legacy `options` bag (`options.kanban`, `options.timeline`, `options.map`, …). The view write door judges each block in it key by key with that kind's own schema, and stores what it accepts. The interface page passed the bag to the list renderer and the object page dropped it, so the same saved view could show a timeline grouped by one field on one page and ungrouped on the other, or a map with markers on one page and without them on the other.

- **Object page:** passes the stored bag to the list renderer as well. For each kind the bag carries, the view's own top-level block (`kanban`, `timeline`, …) still wins key by key, which is the precedence the spec declares for the bag.
- **Interface page:** a default binding that the page derives from the object (a kanban lane, a calendar or timeline date, a gallery cover, gantt dates) no longer fills a kind that the bag already carries. Before this change, that derived guess could outrank the view's own declaration. The derived `map` binding already followed this rule.

A stored row whose bag still holds a key the door now refuses is shown as stored, the same way on both pages, until its next save. That save is refused, and the refusal names the key.
