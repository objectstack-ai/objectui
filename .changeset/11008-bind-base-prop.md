---
'@object-ui/sdui-parser': patch
'@object-ui/types': patch
---

`validateTree` no longer calls a declared `bind` or `hidden` unknown (objectui#11008).

`BaseSchema` declares `bind` and `hidden` for every node, and no registration declares either as an input. `validateTree`'s base-prop set held neither, so its undeclared-key branch answered every authored one with an `unknown-prop` warning (`has no prop "bind"`), including on the nodes that honour it: `list`, `tree-view` and the `object-*` widgets read `bind` through `useDataScope`, and `SchemaRenderer` reads `hidden` for every node. Both are now base props of the parser tier, so neither draws a diagnostic on any node. A near-miss spelling such as `bindTo` still draws `unknown-prop`.

The cost is named rather than hidden. `data-table` does not read `bind` (objectui#6575), and a `bind` on it now draws nothing at the parser tier either. Its render-time console warning (`[ObjectUI] DataTable bind:`) is the one signal left. The `BaseSchema.bind` docblock, which ships in the emitted `.d.ts`, said that the console warning and the parser tier's `unknown-prop` both named such a `bind`. It now names the console warning as the one signal and says the parser tier is silent. That supersedes the wording the objectui#10981 entry describes for the same docblock: the parser half it names held until this change.

At this change, `placeholder` is also a `BaseSchema` member that `validateTree` does not count as a base prop, and it is left as it was. Some registrations declare it as a typed input, and a base prop skipped the declared-input lookup, so adding it would have silenced their `type-mismatch`.

⚠️ **Dated note, 2026-09-29 — `placeholder` has since become a base prop where a type does not declare it — objectui#11044.** Later in this same release, `placeholder`, `name`, `label`, `description`, `data` and `ariaLabel` join the base props as `where-undeclared` members: each is a base prop only on a type that declares no input of that name. Where a type declares one, the declared input wins and keeps its `type-mismatch`, so no declared type check is silenced. The paragraph above is kept as the reading of this change; the objectui#11044 entry states what ships.
