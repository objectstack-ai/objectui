---
'@object-ui/layout': patch
'@object-ui/plugin-dashboard': patch
---

`@object-ui/layout` and `@object-ui/plugin-dashboard` no longer install a React of their
own. `react` moves from `dependencies` to `devDependencies` at the same pin (`19.2.8`);
`peerDependencies` is untouched, so both packages still ask their host for
`^18.0.0 || ^19.0.0` (objectui#8303).

Both manifests were making two contradictory statements at once: asking the host for React
as a peer, and pinning an exact React 19 of their own. The peer range is the one a consumer
reads; the pin is the one their installer acts on. A consumer on React 18 therefore
satisfied the peer range and **still** got a second, pinned React 19 pulled into their
graph on these two packages' account. Two React copies in one tree is the classic cause of
`Invalid hook call`, and the failure is not at install time — it is at first render, in the
consumer's own component, with nothing pointing back at these manifests.

Re-measured on `origin/main` at `348725a7c` across all four `pnpm-workspace.yaml` globs
(46 packages), rather than inherited from the card:

    declares a react peer AND pins react in dependencies    2   layout, plugin-dashboard
    declares a react-dom peer AND pins it in dependencies    0   (objectui#8198 took that half)
    pins react in dependencies with NO react peer            5   runner, site, 3 examples

The last row is the control that keeps the fix narrow. Those five are applications that
supply React rather than libraries that ask for it: one statement, not two, and correctly
untouched. Against the 20+ sibling libraries the two packages fixed here were the only
outliers, so this converges on the existing house shape — `app-shell`, `auth`,
`collaboration`, `i18n`, `mobile` and `permissions` already carry `react` in
`devDependencies` at exactly this pin.

`scripts/__tests__/react-peer-range-norm-3741.test.ts` gains the invariant so a regression
goes red rather than being re-found by a consumer. That file already owns React manifest
norms across the fixed version group, already walks the workspace globs, and already
governs `react` + `react-dom`, so this is a second assertion on an existing guard rather
than a new one. It asserts the CONTRADICTION, not "React in `dependencies`" — widening it
further would go red on the five applications above for doing the right thing.

Two gates are green on this shape by construction and neither green was a reading of it.
`check:unused-deps` asks whether a declared runtime dependency has a consumer, and `react`
is imported by both packages — which is exactly why objectui#8198 could see and remove the
`react-dom` half here and could not see this one. `check-changeset-presence.mjs` reads an
eight-field allowlist that includes `peerDependencies` and deliberately excludes
`dependencies`; its own docblock states the trade ("a runtime dependency bump can be just
as user-visible as any of the eight, and this gate still does not see it"). This changeset
is therefore owed by the house rule, not demanded by the gate.
