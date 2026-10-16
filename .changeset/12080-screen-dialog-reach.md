---
'@object-ui/app-shell': patch
---

fix(console): a long flow screen or action parameter list keeps its Submit / Confirm on screen (objectui#12080)

A flow `screen` dialog without an object form, and the action parameter dialog, had no height bound. A screen or a `params` list taller than the window overflowed both edges of the fixed overlay: the heading above the top, the primary action below the bottom. The overlay locks page scrolling, so a mouse wheel moved nothing, and only keyboard focus could reach Submit.

Both dialogs are now at most `90vh` tall. The fields scroll in their own region between the header and a footer that stays on screen. A screen with more than eight declared fields, or a list of more than eight shown params, also gets the wider dialog an object-form step already had, with two columns from the `sm` breakpoint up. Shorter screens and lists keep their previous width and single column.

No new metadata key: the dialog sizes itself by the number of fields.
