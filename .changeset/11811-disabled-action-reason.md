---
'@object-ui/i18n': minor
'@object-ui/components': minor
'@object-ui/app-shell': patch
'@object-ui/plugin-detail': patch
---

A record action greyed out by its declared `disabled` predicate now says why (objectui#11811). It shows the reason "Not available for this record", and the same text is its accessible description (`aria-describedby`), so a screen reader announces it too. Before, the action carried no tooltip, no `title` and no description, so a user could not learn why it was off.

Where it shows:

- **The record page header** (`page:header`, `@object-ui/components`). On an inline action button, hovering it or focusing it from the keyboard opens a tooltip with the reason. On an action in the ⋯ overflow menu, the reason is a second line under the label. A tooltip there could not be reached from the keyboard, because the menu skips a disabled item and traps Tab.
- **The `record:quick_actions` bar** (`@object-ui/plugin-detail`), for example a record page's section bar. Hovering or focusing the button opens the tooltip.
- **The `DeclaredActionsBar`** (`@object-ui/app-shell`), which renders server-declared actions on the approvals surfaces. Hovering or focusing the button opens the tooltip.

A natively disabled button receives no pointer or focus events, so the tooltip's trigger is a focusable wrapper around the button, the pattern Radix documents for a disabled trigger.

What stays unchanged: a button greyed out only while its own action runs shows no reason. So do the header's Edit and Delete that the console injects, whose `disabled` the host computes (for example while the record is locked for approval), and a header action greyed out by a live inline-edit session.

The reason is the same generic sentence for every action. An author-written reason beside the predicate would be a new key on the action spec, which is objectstack's to declare. It is not part of this change.

**Clause-②: yes (widening).** `@object-ui/i18n` gains one language-pack key, `actions.notAvailableForRecord`, translated in all ten packs. No export, prop or type member is added, removed or changed.
