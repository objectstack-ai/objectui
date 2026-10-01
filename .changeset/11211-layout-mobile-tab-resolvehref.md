---
'@object-ui/layout': patch
---

fix(layout): the mobile tab bar opens the same page as the sidebar (objectui#11211)

With `mobileNavMode: 'bottom_nav'`, `AppSchemaRenderer`'s bottom tab bar used to
build each tab's link itself, so some navigation entries opened a different page
there than in the sidebar:

- a record deep link (`recordId`) opened the object's list instead of the record;
- an entry with `filters` opened the list without its filter;
- an entry with `runAction` opened the list without running its action;
- a `metadata:*` component entry opened the generic component route instead of
  the metadata page;
- a `page` entry dropped its `params`, and `recordMode: 'edit'` was ignored.

Every tab now links to exactly the page its sidebar row links to. Two related
behaviours follow the sidebar too: the highlighted tab is the one whose sidebar
row is highlighted (at most one tab lights, and a filtered or quick-action tab
lights on its own page), and a `url` entry with `target: '_blank'` opens in a
new browser tab.
