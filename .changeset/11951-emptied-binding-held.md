---
'@object-ui/app-shell': patch
---

Studio keeps a dashboard widget as an unsaved edit while the author changes its measure, instead of showing a red error the moment the last measure is removed (objectui#11951).

- **Interfaces page, a dashboard in Design mode.** Removing a widget's last measure in the widget inspector no longer sends the widget with an empty measure list, so it no longer draws a 422 and a red "Changes not saved" strip. The widget is held as a new, unbound widget is held: a neutral line names what it needs ("Not saved yet: Values (measures) on the widget “Pipeline” needs a value."), the inspector says "Required" under the measures, and Publish refuses while it is held. Picking another measure saves the dashboard as usual.
- **Every binding input, in every unset state.** A dataset cleared to an empty name is held like an absent one. A dimension list emptied of its last dimension is saved at once wherever the spec accepts that, which is every widget type with one measure. Where the spec refuses it, a scatter with two measures and no dimension, the widget is held and the inspector says "Required" under the dimensions.

A widget the spec refuses for anything else, such as a dataset name that is wrong or two measures on a metric or a pie, is still sent, and its refusal shows the red strip as before. Nothing is added to the package entry: no export, prop, type member or language-pack key.
