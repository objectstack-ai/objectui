---
'@object-ui/plugin-detail': patch
---

A related list's action-refusal notice is shown to the people who can fix the page, not to every viewer (objectui#11768).

When a `record:related_list` names an action id in `actions` that the related object does not define, or one the list has nowhere to draw, the list draws no button for it and names it in a notice above the list (objectui#11163). That notice is an authoring fault, and `os validate` already refuses such an id at build time. It used to be drawn for whoever opened the record, so an end user read a configuration error they could neither fix nor act on.

The notice is now drawn only:

- for a viewer who holds the metadata-edit capability, `manage_metadata`, read the way the console's Studio entry points read it. A permission provider that never reports capabilities (a backend predating ADR-0066, the role-based provider, or no provider at all, as in the Studio designer) counts as holding it. A reported capability set without it, including an empty one, does not;
- or in dev mode, meaning the build's `NODE_ENV` is not `production`.

Everything else is unchanged for every viewer: the refused id still draws no button, the ids that resolve still render, and a list with no refused id renders exactly as before.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
