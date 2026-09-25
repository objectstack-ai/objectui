---
'@object-ui/app-shell': patch
---

The Hook inspector's object picker stops calling a selected object "not
published", and stops telling the author to publish one, while its object
roster is still loading or after the fetch failed (objectui#10585).

The picker made two claims from the object catalog: a selected object the
catalog does not list was flagged `(not published)`, and an empty list printed
"No objects found — publish an object, then pick it here." Both were read off
the list alone, and the list is empty while the fetch is in flight and after it
failed, exactly as it is for a catalog with no objects. So every selected
object was called unpublished, and the author was told to publish one, before
the catalog had answered; on a failed fetch the claims never cleared.

`useObjectOptions` now reports a failure as its own fact: beside `options` and
`loading` it returns `error`, spelled the way `useObjectFields` spells it, and
`null` while in flight and after an answer. `options` and `loading` are
unchanged, so the action and page-block object pickers, which read only those
two and fall back to a free-text input while the list is empty, behave as
before.

The Hook inspector reads the three through `rosterFrom`, the rule the
objectui#8862 / objectui#9651 family set for the designer's pickers: only an
answered roster may make a claim.

- Answered: unchanged — a selected object the catalog does not list is flagged,
  and an empty catalog prints the "publish an object" copy.
- In flight: a selected object is shown bare, and the empty list says it is
  loading.
- Failed: a selected object is shown bare and stays toggleable, and a status
  notice says the options could not be loaded and names the cause, with the
  same localized title the designer's other pickers use for a failed catalog.
