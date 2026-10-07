---
'@object-ui/i18n': minor
'@object-ui/app-shell': patch
'@object-ui/plugin-detail': patch
---

A record action greyed out by its declared `disabled` predicate now says why (objectui#11811). Hovering it, or focusing it from the keyboard, opens a tooltip that reads "Not available for this record", and the same text is the button's accessible description (`aria-describedby`), so a screen reader announces it with the tooltip closed. Before, the button carried no tooltip, no `title` and no description, so a user could not learn why it was off.

Where it shows: the `record:quick_actions` bar (`@object-ui/plugin-detail`), and the `DeclaredActionsBar` (`@object-ui/app-shell`) that renders server-declared actions on the approvals surfaces. A natively disabled button receives no pointer or focus events, so the tooltip's trigger is a focusable wrapper around the button, which is the pattern Radix documents for a disabled trigger. A button that is greyed out only while its own action runs is unchanged, and shows no reason.

The reason is the same generic sentence for every action. An author-written reason beside the predicate would be a new key on the action spec, which is objectstack's to declare. It is not part of this change.

**Clause-②: yes (widening).** `@object-ui/i18n` gains one language-pack key, `actions.notAvailableForRecord`, translated in all ten packs. No export, prop or type member is added, removed or changed.
