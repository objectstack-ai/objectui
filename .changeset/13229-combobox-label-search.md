---
'@object-ui/components': patch
---

`Combobox` finds an option by its visible label, not only by its value (objectui#13229).

The search box filtered on each option's `value` alone, because the list it runs on (cmdk) matches an item's value and keywords and never its displayed text. Typing a label that is not part of the value found nothing: "Opportunities" for `crm_opp`, a person's name for a record id, a Chinese label for an API name. Each option's `label` is now passed to the list as a keyword, so typing either the label or the value finds it.

What a pick commits is unchanged: `onValueChange` still receives the option's `value`. Every picker built on `Combobox` inherits the fix, among them the console's Audit Log object filter, the `object-ref`, `recipient-picker` and registry-reference field widgets, the dashboard widget's dataset picker, and the `combobox` schema node. No export, prop or type changes.
