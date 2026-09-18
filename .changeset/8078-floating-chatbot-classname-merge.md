---
'@object-ui/plugin-chatbot': patch
---

Merge an authored `className` into the floating chat panel instead of replacing it
(objectui#8078).

`<FloatingChatbot>` ended its `<ChatbotEnhanced>` element with a bare
`className="h-full border-0 rounded-none"` literal written **after**
`{...chatbotProps}`. A later JSX prop always wins over an earlier spread, so the
`className` a `chatbot-floating` node authored — correctly forwarded the whole way,
since the registration destructures it as its own named prop — was silently
replaced. It type-checked, it parsed, and it did nothing to the rendered panel:
the styling escape hatch AGENTS.md #3 requires every widget to expose
(*"Always expose `className` in schema props so users can override via JSON"*),
exposed and inert. Every sibling in this package already merges through `cn()`.

The three classes are now the panel's **default** fit rather than its property:
`cn("h-full border-0 rounded-none", chatbotProps.className)`. This repo's `cn` is
`twMerge(clsx(...))`, so the last conflicting utility wins — an author who declares
`rounded-xl` or `border-2` on a floating node now gets it, while an author who
declares nothing about size still gets the borderless, square, container-filling
inner surface the surrounding panel chrome expects. A node that authors no
`className` renders exactly the class list it rendered before; that control is
pinned beside the fix.

`maxHeight="100%"`, two lines up, has the identical shape and is **deliberately
kept forced** rather than merged — a ruling, recorded in a comment at the line.
`ChatbotFloatingSchema` does not declare `maxHeight` and the `chatbot-floating`
registration forwards none (that authoring face says the key is "NOT declared, on
purpose", for this very reason), so nothing authored is dropped there, while
`<ChatbotEnhanced>`'s own `'500px'` default would cap the conversation well inside
a panel that can be 800px tall — or the whole viewport in fullscreen.

The card recorded that it had measured the defect statically and "not yet confirmed
through a live render". The pin added here is that render: a `chatbot-floating` node
mounted through the real SDUI host, asserting on the rendered panel's own class list
— red before the fix, green after, with the panel's own `h-full` still present beside
the authored classes.
