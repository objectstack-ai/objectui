---
'@object-ui/console': patch
---

The console's first page load no longer downloads the documentation reader's markdown extras (objectui#11854).

The console's `vendor-markdown` chunk is part of every first page load, because the chat message renderer uses most of the markdown pipeline. The chunk also held the parts only the `markdown` component and the package documentation reader use: code highlighting (`rehype-highlight` with `lowlight` and `highlight.js`), heading anchors (`rehype-slug`, `rehype-autolink-headings`, `github-slugger`), GitHub-style alerts (`remark-github-blockquote-alert`) and their helpers. Every first page load downloaded them, for every user. They now load with `@object-ui/plugin-markdown`, the first time a page renders a `markdown` component or a documentation page. `react-markdown` moves to a small chunk of its own, which the first load still fetches because a lazily rendered markdown field shares a chunk with eagerly loaded components.

What renders is unchanged: chat replies, `markdown` components, markdown fields and documentation pages render as before. Nothing is added to or removed from any package entry, and no route, registry key or translation key changes.
