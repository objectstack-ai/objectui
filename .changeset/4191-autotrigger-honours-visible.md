---
'@object-ui/components': patch
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

**Behaviour change:** an action whose own declared `visible` gate hides it is no
longer run by `autoTrigger`, and the refusal is reported instead of swallowed
(objectui#4191).

Before, `action:button` registered its auto-trigger effect above its `visible`
early return, so an action carrying both `autoTrigger: true` and a `visible`
that evaluated false rendered nothing and executed anyway; `action:menu` did the
same for overflow actions, deliberately, to stay in step. The declared nav deep
link made that reachable from a URL: `ObjectView` armed the requested action
after checking only its placement, so any list-page link naming an action its
author had hidden there ran it.

The author's verdict now outranks the transport flag:

- `action:button` and `action:menu` refuse the auto-trigger of an action their
  own `visible` gate hides. Both go through the one shared hook, so which
  renderer received the action (decided by `action:bar`'s `maxVisible`, and so by
  the viewport) cannot change the outcome. The refusal shows a warning toast
  naming the action, from the new `actions.notAvailableHere` key (all ten locale
  packs), and writes a console diagnostic in development builds. An action whose
  predicate becomes true later in the same mount still runs, once.
- The deep-link preparation step on the object list evaluates the same
  predicate before it marks the action `autoTrigger`. A hidden action is not
  armed and the deep-link parameter stays in the URL, so the one-shot intent is
  not spent on nothing, and the same notice is shown.

This was never an authorization boundary: confirm dialogs, parameter
collection, entitlement checks and server-side permissions apply on every
execute path, before and after this change. What the gate now protects is the
author's rule about where an action may be offered.
