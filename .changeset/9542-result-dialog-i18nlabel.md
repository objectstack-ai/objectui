---
'@object-ui/core': patch
'@object-ui/app-shell': patch
'@object-ui/components': patch
---

Accept an inline per-locale label on an action's `resultDialog`, and resolve it
against the display language (objectui#9542).

`@object-ui/core`'s `ResultDialogSpec` claimed in its own docblock to mirror
`Action.resultDialog` in `@objectstack/spec` and did not: `title`,
`description`, `acknowledge` and each `fields[].label` were hand-written
`string` where the contract declares every one of them `I18nLabel` — a plain
string **or** an inline per-locale map, both authorized by that type's docblock
and neither deprecated. This repo therefore refused what the platform accepts,
which is the `check:spec-symbols` rule-2 failure class (an alignment CLAIM with
a hand copy behind it), one package over from where that gate matches by name.

**The consequence was measured, not inferred.** The map arm reached
`ActionResultDialog`'s JSX as a React child and React refuses an object there,
so the dialog did not mis-render — it threw and failed to render at all, on an
action that had **already succeeded**. That dialog is the only place a one-shot
reveal is ever shown (a TOTP secret, a freshly minted OAuth `client_secret`,
regenerated backup codes), so the value was gone. The rendering test in
`packages/app-shell` reproduces the throw: it is red on the unfixed tree with
`Objects are not valid as a React child (found: object with keys {en, zh-CN})`.

The four members now DERIVE from the contract type instead of restating it, so
the mirror cannot drift again without `tsc` saying so, and the dialog resolves
each through `resolveI18nLabel` from `@objectstack/spec/ui` — the producer's own
resolver for the inline form — against `useObjectTranslation().language`, the
same display locale every other inline-`I18nLabel` caller in `app-shell`
resolves against. A plain-string label is unaffected: the resolver returns it
unchanged, and the existing fallback chain still answers for an absent label or
a map with no usable entry.

Both action renderers drop the write-side narrowing assertion objectui#8648 had
to leave behind, so the whole `resultDialog` forward is compiler-checked again
with nothing asserted between it and `ActionDef`. The ledger leg that pinned
that workaround is converted rather than deleted outright: the `as any` negative
it carried is not a workaround and still guards a write-side cast that the
read-side matcher walks straight past.
