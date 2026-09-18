---
'@object-ui/react': minor
---

`useNavigationOverlay` stops reading the retired `navigation.view` key, and stops substituting an authored name for the navigation-MODE token

`view.list.navigation.view` was removed in `@objectstack/spec` 17.5.0 under ADR-0049
(enforce-or-remove). `useNavigationOverlay` was its one shipped consumer, and the spec's
tombstone describes that hook by name: the authored value "was passed straight into the
navigation-MODE argument of the console's `onNavigate`, where anything other than `edit`
or `view` matched no branch, so the key selected nothing and could silently deaden the
row click."

The second argument of `onNavigate` is the navigation MODE token, not a view name. The
hook read `const view = navigation?.view` and spent it at two call sites as
`view ?? 'view'` — the no-config early return and the `page` branch — so an authored
`{ mode: 'page', view: 'summary_view' }` dispatched `'summary_view'` into a slot hosts
read against a closed `edit`/`view` vocabulary. An authored name did not SELECT a view,
it SUBSTITUTED for the mode.

Both call sites now pass the literal `'view'`, which is what every config WITHOUT the key
already dispatched. No replacement route is wired into this hook, and no fallback belongs
here: per the same tombstone, choosing what opens for a record is page assignment — assign
a `record` page to the object and let `isDefault` pick the one that opens — while a list
view's `navigation` block only decides HOW the detail is surfaced (`mode`, `size`).

**Breaking for anyone who authored the key, and for anyone reading the hook's `view`
member.** `NavigationOverlayState` no longer publishes `view`. It could only ever carry
the retired key, so keeping it would publish a field that is permanently `undefined` —
the same "declared, consumed, and wrong" state the retirement exists to end. Measured
before removing it: zero readers of that member anywhere in this repository, against a
lit control on its sibling members in the same command. Hosts outside this repository
were not measured. Per this repo's version policy a breaking change ships as `minor`; the
semantics are stated here rather than in the bump.

Behaviour on the Console is unchanged, and that is the point rather than a caveat:
`ObjectView`'s `onNavigate` already routed every non-`new_window` action to the same
record-detail route, so the substitution was inaudible exactly where it was loudest in
the metadata. Its comment claimed a custom name was "resolved by RecordDetailView from
its own config"; no layer ever resolved a view by that name, and the comment is corrected
with the read it described.

Two existing pins asserted the substitution as intended behaviour and are INVERTED rather
than deleted — `useNavigationOverlay.modeDefault` and `gridNavigationMembers-8071`, both
keeping their authored `view` fixture because it is the one input the old and new
implementations disagree about.
