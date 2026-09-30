---
'@object-ui/app-shell': patch
'@object-ui/plugin-designer': patch
---

fix(app-shell,plugin-designer): standard navigation entries are written with no `label`, never with a copy of their target's text (objectui#11201)

A navigation entry's `label` is optional. An entry without one shows, at render time, the current
label of what it opens, in the viewer's language. A present label is shown as written. The
platform's own producers of standard entries now leave the label out, so the entry keeps following
its target:

- Studio's Create app with "add objects" seeds one entry per package object. Each entry used to
  store the object's label, or its machine name for a draft or unlabelled object.
- Binding an object to a placeholder entry in the Studio's nav-item panel used to replace the
  placeholder with the object's label. It now removes the placeholder. A label the author typed, and
  a locale-map label, are kept.
- The app wizard's generated object entries used to store the object's plural label, else its
  label, and the create and edit pages hand the wizard the machine name for an unlabelled object.
  An entry now stores a label only when the object declares a plural label, and only when that
  plural label differs from both the object's label and its machine name.

The console's navigation sync already writes page and dashboard entries this way. Stored navigation
is not converted.
