---
'@object-ui/react': patch
---

Correct the read rule in the `InlineEditContextValue.draft` doc comment (objectui#10466).

It told hosts to read a field's live value as `draft[name] ?? data[name]`. That read
falls back to the saved value when the draft value is `null` or `undefined`. A field the
user emptied is an own draft key with an empty value, and so is a single select or radio
emptied by a cascade clear, which stages `null` since objectui#10291. A host that followed
the comment showed the value the user had just removed, and handed it back to an option
widget that pruned it, which pruned it again on every render (the loop objectui#7190 fixed
on the highlights strip).

The comment now teaches the own-key read: take the value from the staged record
`{ ...data, ...draft }`. An own draft key wins even when its value is empty
(`null`, `undefined`, `''`), and the saved value is read only when the key is absent. The
comment ships in `dist` typings and is what a host author sees on hover. No runtime
behaviour changes. A source-text pin keeps the comment from teaching a fallback read again.
