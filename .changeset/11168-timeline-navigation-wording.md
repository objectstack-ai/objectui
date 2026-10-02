---
'@object-ui/plugin-timeline': patch
---

The `object-timeline` / `view:timeline` `navigation` input description had three wording errors, and all three are corrected (objectui#11168 slice 3, from the contract record on objectui#8654 and the one on PR #11335).

- The reason `split` opens nothing (the timeline hands the split shell no main panel) was attached to `page` and `none` as well. It now applies to `split` alone.
- The description said `openNewTab: true` "outranks the mode". That does not hold for `none`, which is checked first, as `preventNavigation` is. The description now says `openNewTab` outranks every mode except `none`.
- The description said `page`, and a block without `mode`, open nothing on a timeline no parent view navigates for. Since objectui#11293 they open the record page through the record navigator the host publishes (the console publishes one on its custom pages, record pages and list views), and they open nothing only under a host that publishes none. The description now says so. An absent key still opens nothing.

The README and the docs page's navigation table and callout are corrected the same way. Behaviour is unchanged.

**Note, 2026-10-02 (objectui#11168 slice 5, shipping in this same release).**
"They open nothing only under a host that publishes none" above holds for a
timeline that names its `objectName`. Slice 5 made `objectName` optional, and
on a timeline that names none, `page` and a block without `mode` open nothing
under any host, while `new_window` and `openNewTab: true` open a tab at a slash
and the entry's `id` alone, not the record page. The description now says both.
