---
'@object-ui/app-shell': minor
---

feat(app-shell): Studio has a Markdown editor for `doc` items, with a live preview and book placement (objectui#10188)

An admin can now write a documentation page in Studio. Creating or opening a `doc`
(ADR-0046) in the metadata admin shows a Markdown source pane beside a live preview,
rendered by the same `markdown` renderer the docs portal uses, so the page reads the way
readers will see it. Before, the generic form offered the body as a one-line text input
with no preview.

The editor writes only keys `@objectstack/spec`'s `DocSchema` declares, and saves through
the standard metadata write door (`PUT /meta/doc/:name`) like every other type:

- **Title and body** — the create form asks for the title (`label`), suggests the `name`
  from it, and the body (`content`) is written in the source pane.
- **Locale variants** — a variant is an entry of `translations`, as the spec models it.
  A new variant starts as a copy of the default body, because an empty variant is served
  to that locale's readers as an empty page.
- **Book placement** — a book stores no members; a doc joins a book group through its own
  `group` key (ADR-0046 §6.2.1). The editor lists every book's sections, writes the one
  picked, and shows where the doc will appear, computed with the spec's `resolveBookTree`,
  including placements a group's name or tag rule makes on its own. A book section key is
  not unique to one book, so every book that uses the key is listed, and a public book is
  marked as such.

The metadata admin also has a label for the `doc` type in English and Chinese
("Documentation" / "文档").
