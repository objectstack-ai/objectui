---
'@object-ui/plugin-detail': patch
---

fix(plugin-detail): a related list's `list_toolbar` action authored `visible: false` is hidden

`RelatedToolbarButton` decided whether an action declared a `visible` gate by
truthiness. A literal `visible: false`, the most explicit way an author can say
"never show this", is falsy, so the gate was skipped and the header button
rendered for everyone. It now asks the question with `hasDeclaredVisibilityGate`,
the one definition the rest of the action family already uses (objectui#3812):

- `visible: false` hides the button.
- A blank predicate (`''`, or a whitespace-only string) is no gate, so the button
  shows. A whitespace-only `visible` used to hide the button; it now shows, as it
  does on every other action surface.
- A CEL string is evaluated, as before.
- A predicate that faults still hides the button and is reported once
  (objectui#11212), unchanged.

The server still judges the action's permission when it runs; this is the
presentation gate.
