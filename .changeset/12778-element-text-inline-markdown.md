---
'@object-ui/components': minor
---

`element:text` now draws the inline Markdown its spec declares (objectui#12778). `ElementTextPropsSchema.content` is described as "Text or Markdown content", and the renderer printed it as typed, so a `[sales](mailto:…)` link or `**bold**` in a sentence came out verbatim. The content, a plain string or an inline locale map, now renders `**bold**`, `*italic*`, `` `code` `` and `[text](url)` as React elements inside the same single `p` or `h1`–`h6` tag. Block syntax (a `#` heading, a `- ` list item, a fence) prints as typed, because the tag holds one line of inline content. Raw HTML is skipped: neither rendered nor printed.

A link keeps its `href` only for `http:`, `https:`, `mailto:`, `tel:` or a scheme-less path, query or fragment. Any other scheme (`javascript:`, `data:`, `vbscript:`, in any case, and an `href` carrying whitespace or a control character) prints the link's text with no anchor. An `http:` or `https:` link opens a new tab with `rel="noopener noreferrer"`; a same-site path, `mailto:` and `tel:` stay in the current tab.

Plain text renders as before: a lone `*`, `2 * 3 * 4`, `snake_case` and brackets without a destination are left as typed, because an emphasis delimiter may not sit against whitespace on its inner side.

Clause-②: yes

The package entry gains `renderInlineMarkdown`, its options type `InlineMarkdownOptions`, and the two CommonMark raw-HTML grammar pieces `RAW_HTML_OPEN_TAG` and `RAW_HTML_CLOSING_TAG` (RegExp sources). They are exported because `@object-ui/app-shell`'s marketplace README renderer draws its inline text and its HTML-block rules with the same implementation, so there is one copy. No existing export changes.
