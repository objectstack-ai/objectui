---
'@object-ui/app-shell': patch
---

Studio's RLS policy editor now gives a predicate the runtime cannot lower the server's verdict: an error that holds Save and autosave (objectui#13061). A `USING` or `CHECK` clause outside the lowerable subset, such as `size(record.asset_code) > 3`, was a warning before. The draft autosaved, and publish and `os build` then refused it as `rls-predicate-unenforceable`.

The verdict comes from `isSupportedRlsExpression` in `@objectstack/formula`. That is the function the RLS compiler and `@objectstack/lint`'s rule use, and it now covers both clauses. The message is the one `@objectstack/lint` prints, as written: the policy is dropped and grants no access, or admits no write. The old warning said such a predicate could "WIDEN access". That is wrong, because the runtime fails closed. That sentence and its catalogue key `engine.celLint.notPushdownable` are removed in both locales.

A lowerable predicate, such as `record.asset_code == 'A1'`, stays clean.
