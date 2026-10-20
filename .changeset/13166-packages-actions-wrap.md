---
'@object-ui/app-shell': patch
---

fix(app-shell): Setup › Packages draws its Actions column only over rows that carry an action, and the package sheet wraps its values at words (objectui#13166)

- **The Actions column.** The header used to show whenever the marketplace capability was on and the
  viewer was a workspace admin, while a cell had content only for a marketplace row with an install
  entry. An install with no such row drew an Actions header over an empty cell in every row. The
  column now shows only when a row in view carries an action; a search or a `?source=` filter that
  hides every marketplace row hides the column with them. With a marketplace row in view, the column
  and its Details and Uninstall actions render as before.
- **The package sheet.** A value in the sheet (Version, Type, Scope, Status, Description) broke
  between any two letters, so a Description read "marketplac / e" and "Con / tracts". It now breaks
  at word boundaries, and inside a token only when that token alone is wider than the line, so a long
  version or URL still wraps inside the sheet.
