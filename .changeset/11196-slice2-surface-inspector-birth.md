---
'@object-ui/app-shell': patch
---

fix(app-shell): the Studio surface, its nav-item inspector and a new canvas entry inherit a label-less entry's label, the way the console does (objectui#11196)

A navigation entry's `label` is optional: an entry without one shows, at render time, the current
label of what it opens. The Studio Interfaces rail already names such an entry that way; three
places beside it did not.

- **The open leaf's canvas caption, breadcrumb and copilot chip.** The Surface a leaf opens carried
  its authored label only, so a label-less leaf's caption and breadcrumb showed the target's internal
  name and the copilot's "discussing" chip showed `type · name`. The Surface is now named by the
  runtime's own rule (`resolveNavItemLabel`, through the console's target resolver) however the leaf
  opens: the first leaf on load, a `?surface=` link, or a click on a rail row. They now read the
  text the rail row reads; the internal `type · name` stays on their tooltips.
- **The Studio nav-item inspector's Label field.** It now works as the app nav inspector's does: the
  field's value is the authored label, its placeholder is the text the entry inherits (it used to
  be a fixed "e.g. Positions" hint), and emptying the field removes the `label` key, so the entry
  inherits again. It used to write `label: ''`, an entry that then showed nothing. For a locale-map
  label only the designer locale's own entry is dropped.
- **A new entry on the nav canvas** is created with no `label`. It used to be created with a
  localized "New item" label, stored as if the author had typed it, and a present label renders
  verbatim, so an entry bound to an object kept saying "New item" wherever the object pickers did
  not recognise that placeholder. The card now shows the entry's `id` until a target is bound, and
  then the target's label. Binding an object in the Studio inspector no longer rewrites the label at
  all: a label-less entry stays label-less, and a present label is kept as it is, including a
  "New item" label stored by an earlier version.

The designer strings `engine.appNav.newItem` and `engine.studio.nav.labelPlaceholder` had no reader
left and are removed from the designer's string table.
