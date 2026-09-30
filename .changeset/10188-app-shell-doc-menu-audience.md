---
'@object-ui/app-shell': minor
---

feat(app-shell): the sidebar and `nav:menu` hide a `doc` entry the member may not read (objectui#10188)

A `type: 'doc'` navigation entry is drawn only when the member can read what it opens:

- a page — the member's `doc` list names it;
- a book — the member's `book` list names it, or the name is a package one of the member's
  readable docs comes from (the implicit per-package book);
- a page in a book — both.

Those lists are the server's per-member answers (ADR-0046 §6.7 prunes both), read through the
shell's metadata cache, once per type and only when the navigation holds a `doc` entry. No
`audience` is read in the browser. While a list is still loading, or failed to load, nothing
is hidden: the app the server sent stands.

On a current server this changes nothing a member sees. The server's app read already leaves
such an entry out (objectstack#19790). The menu's own pruning is the defence in depth that
ruling keeps behind it, for an app document that still carries the entry.
