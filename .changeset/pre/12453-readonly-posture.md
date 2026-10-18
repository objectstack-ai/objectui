---
'@object-ui/app-shell': patch
---

A read-only package now says it is read-only in two places in the Studio, the same in every pillar (objectui#12453).

- **The app chip.** After the package name, a small lock and the word "Read-only" in muted text replace the amber "Read-only" badge. Hover it for the reason: "Read-only package — switch to or create a writable package to edit."
- **The item header.** At the right of the open object's, flow's, navigation entry's or permission set's header, one link reads "Read-only · Customize with an overlay". It opens the package's metadata directory (`/apps/setup/metadata?package=` and the package id), where each metadata type says whether it accepts an environment overlay. Its tooltip carries the pillar's read-only sentence.

Retired with it: the Access pillar's "This package's objects · read-only" note, the Layout control's read-only tooltip on the Data pillar's Form tab, and the Form toolbar's "Read-only package · click a field to view its properties" hint. On a read-only package each field card's tooltip now says "Click a field to view its properties". The inspector asides of the Data, Automations and Interfaces pillars no longer end with "Edits save as drafts. Publish the package to apply them." on a read-only package, where nothing is saved or published. Publish stays the outline disabled button with its reason, the rail's add button stays hidden, and records can still be added and edited.

Language packs: `engine.studio.pkg.readonlyLink` and `engine.studio.designer.fieldTitleReadOnly` are added; `engine.studio.access.bannerReadOnly`, `engine.studio.designer.hintReadOnly` and the unused `engine.studio.designer.hint` are removed. No export or prop changes.
