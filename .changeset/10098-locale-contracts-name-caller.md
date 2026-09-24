---
'@object-ui/core': patch
'@object-ui/i18n': patch
'@object-ui/plugin-report': patch
---

The two declared display-locale contracts now each name the caller they govern,
and each points at the other (objectui#10098). This is documentation only: no
module's behaviour moves.

- `DisplayNumberFormatOptions.locale` (`@object-ui/core`): leaving the tag
  `undefined` means the runtime default, and that rule is written for a non-React
  display caller with no tag in hand. For that caller the viewer's own environment
  is the honest locale for a user-facing display. A malformed tag lands in the
  same place through `formatDisplayNumber`'s retry.
- `useDisplayLocale` (`@object-ui/i18n`): its concrete `'en'` last resort, kept for
  determinism, is the rule for a React renderer whose provider chain yields no tag
  at all, not a rule for every caller without a tag.
- `formatNumberInDisplayLocale` (`@object-ui/plugin-report`): the note on its
  malformed-tag retry no longer calls the dropped-tag retry behind
  `formatDisplayNumber` a wrong answer. Each retry follows its own package's
  declared contract.

Read alone, either docblock used to look like a rule for every caller, and each
contradicted the other. The new wording reaches each package's published type
declarations, which is why this is declared as a patch rather than left
undeclared.
