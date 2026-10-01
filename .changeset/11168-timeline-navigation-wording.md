---
'@object-ui/plugin-timeline': patch
---

The `object-timeline` / `view:timeline` `navigation` input description had two wording errors, and both are corrected (objectui#11168 slice 3, from the contract record on objectui#8654).

- The reason `split` opens nothing (the timeline hands the split shell no main panel) was attached to `page` and `none` as well. It now applies to `split` alone.
- The description said `openNewTab: true` "outranks the mode". That does not hold for `none`, which is checked first, as `preventNavigation` is. The description now says `openNewTab` outranks every mode except `none`.

The docs page's navigation table is corrected the same way. Behaviour is unchanged.
