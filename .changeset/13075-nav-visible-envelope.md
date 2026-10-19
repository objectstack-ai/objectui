---
'@object-ui/types': minor
---

A navigation item's `visible` now takes `@objectstack/spec`'s `EvaluatedExpressionInputSchema` by reference, beside the boolean it already took (objectui#13075).

The spec types every navigation entry's `visible` as an evaluated expression input: a non-blank CEL string, or the `{ dialect, source }` envelope the spec's own parse produces. objectui's `NavigationItemSchema` typed it as `boolean | string`, so the two disagreed both ways. This changes what `NavigationItemSchema` (and so `objectui validate`) accepts:

- **Widened: the envelope is accepted.** `visible: { dialect: 'cel', source: "'org_admin' in current_user.positions" }` used to be refused. It parses now and is kept as written. The TypeScript type `NavigationItem['visible']` is `boolean | EvaluatedExpressionInput` (the spec's input type), so a typed literal can carry the envelope too.
- **Narrowed (breaking): a blank string is refused.** `visible: ''` and a whitespace-only string used to pass. They are refused now with the spec's own code (`invalid_union` at `visible`) and sentence. A blank `source` inside an envelope is refused at `visible.source`, as the spec refuses it. To show an entry to everyone, omit `visible`.

Unchanged: a non-blank string is still accepted and kept as a string (the validator does not rewrite it into an envelope), and `visible: true` / `false` are still accepted. The boolean is the one stated divergence from the spec on this key.

Code that reads `NavigationItem['visible']` and passes it on as `string | boolean` no longer compiles: widen that parameter to `NavigationItem['visible']`.
