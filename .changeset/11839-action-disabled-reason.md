---
'@object-ui/components': patch
---

An action drawn by `action:button`, `action:icon`, `action:group` or `action:menu` and greyed out by its declared `disabled` predicate now says why (objectui#11839). It shows the reason "Not available for this record", the same generic sentence and the same language-pack key (`actions.notAvailableForRecord`) objectui#11811 gave the record header, the section bar and `DeclaredActionsBar`. The same text is the control's accessible description (`aria-describedby`), so a screen reader announces it too. Before, the control carried no tooltip, no `title` and no description.

Where it shows:

- **A button** (`action:button`, `action:icon`, and an `action:group` member in inline mode, including the members `action:bar` draws). Hovering it or focusing it from the keyboard opens a tooltip with the reason. A natively disabled button receives no pointer or focus events, so the tooltip's trigger is a focusable wrapper around it. On `action:icon`, which has no visible label, the tooltip shows the label above the reason, and the icon's accessible name stays its label.
- **A menu item** (an `action:menu` item, including `action:bar`'s overflow menu, and an `action:group` member in dropdown mode). The reason is a second line under the label. A tooltip there could not open: a disabled menu item takes no pointer events, and the menu's keyboard navigation skips it.

What stays unchanged: a control greyed out while its own action runs, a control the host disables (the `disabled` it forwards, such as a disabled group's members), and an action disabled only through the legacy `enabled` key show no reason.

**Clause-②: no.** No export, prop, type member or language-pack key is added, removed or changed.
