---
'@object-ui/app-shell': patch
---

fix(app-shell): on the object route, a view that declares no `columns` applies neither `hiddenFields` nor `fieldOrder` (objectui#10694)

`ListViewSchema.columns` says "An empty list declares no projection, so neither
of them applies: which columns show is then left to the renderer". That text is
`@objectstack/spec` source at objectstack `origin/main` (objectstack#19598). It
is not in the released 17.4.0.

`ObjectView` draws the object's default columns into a grid-like view that
declares none. It then applied that view's `hiddenFields` and `fieldOrder` to
those defaults, so the defaults came out with columns removed and re-sorted.
Now both keys apply only when the view, as authored, declares a non-empty
`columns`. A view with no `columns` key reads the same as `columns: []`. This is
the same gate `InterfaceListPage` already puts on a source view (objectui#10638),
so a view composes one way on both routes.

The view config panel starts its draft from the columns on screen, so on such a
view its draft holds the drawn defaults. Those do not count as declared, after
an edit to another field or after Discard. Only `columns` the admin changes in
the panel count, and then both keys apply in the preview.

The hide-column toggle follows the seat ruling on the card (comment
5839344270, option B):

- On a system view that declares no `columns`, the toggle is session-only. It
  hides the column for this session and writes nothing. That holds after an
  edit to another field or a Discard in the view config panel. Before this
  change the toggle wrote an overlay `hiddenFields`, and nothing would read that
  back now. A system view's overlay cannot carry `columns` either.
- The author's remedy is to declare `columns` on the view. After that, the
  toggle persists as before.
- A saved view keeps persisting as before. Its write is the whole view, with
  the drawn columns included, so the reload reads a view that declares them.
