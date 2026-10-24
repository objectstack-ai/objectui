---
'@object-ui/fields': patch
---

`html` and `richtext` values are now sanitized with `rehype-sanitize`, the sanitizer the `markdown` pipeline already used, instead of a hand-written pattern filter.

A stored value is parsed with the browser's HTML parser, filtered against one allow-list of elements, attributes and URL protocols, and rendered as React elements. Both display pipelines share that allow-list. Headings, paragraphs, emphasis, lists, quotes, code, tables, links and images keep their formatting. Event-handler attributes, `style`, script-bearing URLs, embedded frames and objects, and SVG and MathML content are dropped. A link whose URL is refused now renders without an `href`, where it used to point at `#`. Stored `id` and `name` values are prefixed with `user-content-`.
