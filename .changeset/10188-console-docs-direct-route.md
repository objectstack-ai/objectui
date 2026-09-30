---
'@object-ui/console': minor
---

feat(console): the docs portal refuses a doc or book the member may not read, and opens a doc in the book that claims it (objectui#10188)

- **A refusal, not "not found".** A member outside a doc's or a book's audience who opens its
  direct URL — `/docs/DOC`, `/docs/BOOK` or `/docs/BOOK/DOC`, also under an app's
  `/apps/PACKAGE/docs` — now sees "You do not have access to this documentation" with the
  server's reason. Before, the flat routes said the doc "is not installed" and the reader said
  "Failed to load documentation". The server answers such a member 401 / 403 and an absent
  name 404; the portal now keeps the two apart. A segment the member's own lists do not answer
  is asked about once, by name (the doc, then the book). A name nothing carries still shows
  "Documentation not found".
- **The claiming book.** In a package with several books, a flat doc permalink (what a
  `{ type: 'doc', doc }` menu entry links to) opens the page in the book that claims it,
  with that book's sidebar. Before, it opened in the package's first book by label, where the
  page is only an uncategorized orphan. A page no book of its package claims opens in the
  package's first book, as before.
