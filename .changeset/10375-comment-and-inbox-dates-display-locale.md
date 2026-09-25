---
'@object-ui/collaboration': patch
'@object-ui/console': patch
---

Two more dates now follow the display locale, not the UI language (objectui#10375).

- `CommentThread` (`@object-ui/collaboration`): a comment seven or more days old shows an absolute
  date, and that date now takes its locale from `useDisplayLocale()`. It used to format with the UI
  language, so a regional display locale was ignored: an English UI with a `de-CH` display locale
  read `3/4/2020` where it now reads `4.3.2020`. With no display locale declared, and with no
  provider mounted at all, the date renders as before, because the display locale then falls back
  to the UI language. A malformed display locale still falls back to the runtime's own date format,
  never to the raw ISO string.
- The approvals inbox (`@object-ui/console`): once a submitted, completed or history timestamp is
  30 days old (rounded to the nearest day), the inbox shows a date instead of "Nd ago", and that
  date now takes the page's display locale in the same way.
- The relative wording ("just now", "5m ago", "3d ago") is unchanged on both faces and stays in the
  UI language.
