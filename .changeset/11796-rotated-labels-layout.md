---
'@object-ui/plugin-charts': patch
'@object-ui/app-shell': patch
---

Rotated x-axis labels fit inside the chart, and the dashboard inspector's Layout fields are readable (objectui#11796).

- **Rotated category labels are no longer cut off.** When a bar, line or area chart turns its x-axis labels to fit them, each label hangs its start away from the plot. The axis used to reserve a fixed 60px for them, which counted the text width alone, so the longest labels ran past it and the chart cut off their first letters ("acklog" for Backlog, "ogress" for In Progress on a dashboard bar chart). The axis now reserves the room its longest drawn label needs at the rotation angle: more for long labels, less for short ones, with a wide glyph (Chinese, Japanese, Korean) counted a full em. Every rotated label is now shortened with an ellipsis past 12 characters, also on axes with more than five categories, where a long label used to be clipped mid-word instead. The full name stays on the bar's tooltip. Charts whose labels do not rotate keep the axis height they had.
- **The dashboard inspector stacks its fields.** Studio's dashboard inspector is a narrow side panel, and the dashboard form's Layout section put Columns, Gap and Refresh Interval Seconds in three columns there: a two-digit value showed one digit and the labels wrapped onto several lines. The inspector now renders every section of the form in one column, in the declared field order. Other forms keep the column layout their sections declare.

Nothing is added to either package entry: no export, prop, type member or language-pack key.
