---
'@object-ui/app-shell': patch
---

The marketplace README renderer draws its inline Markdown with `@object-ui/components`' `renderInlineMarkdown`, the one `element:text` uses (objectui#12778), so a README link now passes the same scheme check. Before, a link's destination went into `href` as written; now an `href` survives only for `http:`, `https:`, `mailto:`, `tel:` or a scheme-less path, and any other scheme (`javascript:`, `data:` …) prints the link's text with no anchor. Every README link still opens a new tab. Emphasis now follows CommonMark's flanking rule in its simplest form, so `2 * 3 * 4` prints as typed instead of italicising ` 3 `, and a run of two or more backticks prints as typed. Headings, lists, fences and the raw-HTML skip (objectui#12146) are unchanged.

Clause-②: yes

The new import is `@object-ui/components`' `renderInlineMarkdown` and its raw-HTML grammar pieces; app-shell's own entry is unchanged.
