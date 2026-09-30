---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

fix(app-shell): the save warning has a sentence of its own for a formula field the server ignored

objectstack `b2805465` gave the write path a fourth strip reason, `computed`: a
value the caller sends for a `formula` field is stripped on every write path,
because the server computes that field and has nowhere to store it. The save
warning now words that reason as what it is — "Calculated by the server from a
formula, so the value sent did not take effect: …" — through a new
`detail.writeStrippedComputed` key in all ten locale packs, and never as a
read-only lock, which would send the user after a permission problem that does
not exist.

The reason table stays exhaustive over the spec's union, and one spelling now
compiles against both the published `@objectstack/spec` 17.5.0 (which does not
name the arm) and objectstack `main` (which does), which is what the
`Spec Main Shape Gate` needs to go green again.

When the sentence reaches a user: the adapter judges a reported reason against
the spec release this bundle is built with, and 17.5.0 does not declare
`computed`, so until that release carries it a formula strip from a newer server
is still reported as "Not applied by the server: …" — truthful, but without the
cause. The new sentence is used from the spec release that declares the arm on.
