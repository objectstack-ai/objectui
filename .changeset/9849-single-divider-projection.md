---
'@object-ui/plugin-form': patch
---

The section-configuration → `section-divider` projection is one path, and a modal form
built from an object's own `fieldGroups` metadata now renders each group's authored
`description` (objectui#9849).

Six pushes across `ObjectForm`, `ModalForm` and `DrawerForm` each rebuilt the divider row
key by key. A key one of them forgot was invisible to the author, because its siblings on
the same section arrived in the same call — the same failure carded three times running
for one key (objectui#9779 default arm, objectui#9834 drawer arm, and this card's modal
derived push, the last site still dropping it). A modal form that passes no `sections` and
leans on the object's declared `fieldGroups` drew each group's heading and silently ate
the blurb its author wrote.

All six sites now go through one projection, so the key set is copied once: the blurb, the
ADR-0089 `visibleWhen` predicate, the objectui#6236 membership claim, the collapse pair
and the row's span. A key added there is added for every arm at once, and a key dropped
there is dropped for every arm at once — which is what makes the loss visible instead of
silent.

**What changes for authors.** A `fieldGroups`-derived group renders its `description` in a
modal form, as it already did in a drawer and on the default layout. Nothing else moves:
every arm's gate, its collapse resolution and its predicate handling are unchanged, and
each arm hands its own resolutions to the shared projection rather than inheriting
another's.
