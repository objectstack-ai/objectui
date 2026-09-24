---
'@object-ui/plugin-form': patch
---

`object-form`: a drawer section that declares `collapsed: true` can be opened again. The
drawer now resolves `collapsed` / `collapsible` the way the default layout does
(objectui#9849 step one, which converges the collapse rules onto objectui#9780).

The drawer's explicit `sections` path read `collapsed` for the section's initial state
unconditionally, but installed the disclosure control only for a section that also wrote
`collapsible`. So `formType: 'drawer'` with `collapsed: true` written alone (the most
natural spelling of "collapsed by default") drew a permanently closed section. Its fields
were out of the DOM and nothing on the page could bring them back. The default layout
stopped doing this under objectui#9780. The drawer still did, and its derived-`fieldGroups`
path spelled the same two keys a third way.

All three paths now use one resolution:

- `collapsed: true` implies `collapsible`, so the control is installed.
- `collapsible: false` together with `collapsed: true` resolves in favour of `collapsed`,
  with the control present.
- `collapsible: true` alone is unchanged: the section is open and has the control.
- A section declaring neither member is untouched.
- A section is collapsed only while its row is on the page to carry the control. A drawer
  section with no heading and no description therefore keeps its fields open instead of
  hiding them behind nothing.

Nothing is refused that was accepted before. The accept set is unchanged, and the only
sections that render differently are ones whose fields could not be reached.
