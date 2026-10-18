---
'@object-ui/app-shell': patch
---

The ⌘K command palette lists a navigation entry only when the query is a word prefix or a contiguous substring of its label or machine name, so a query that matches nothing shows "No results" (objectui#11812).

The Objects, Dashboards, Pages, Reports and Switch App groups went through cmdk's default subsequence scorer, which matches letters scattered across an entry. On the showcase app `zzzz` listed "Field Zoo" and "New Project (Wizard)", `ingest` listed "In-Progress Tasks", "Cascading Select", "Page Authoring" and "Styling (ADR-0065)" next to the real record hit, and `wayne` listed "Styling (ADR-0065)" next to Wayne Enterprises.

- **An entry matches** when the query, ignoring case, starts a word of its label or machine name (`field` finds "Field Zoo", `zoo` finds `showcase_field_zoo`), or, from three characters on, appears anywhere in one of them (`view` finds "Task Overview"). A hyphen and a space read alike. There is no typo tolerance.
- **Chinese and Japanese labels**: Han, Hiragana and Katakana are written without spaces, so each of their characters starts a word, and a one-character query finds a label that holds it anywhere.
- **The theme and "Open Full Search Page" commands** follow the same rule over the words they were already searched by (`theme light`, `search all results full page`).
- **Record hits are unchanged**: the server search finds them, and each is listed as before.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
