---
'@object-ui/app-shell': minor
'@object-ui/i18n': minor
---

The suggested-bindings panel shows each suggestion's real state and can revoke an acceptance (objectui#7611, after objectstack#22854).

On a framework where a `manage_metadata` holder's accept takes effect for the whole deployment (objectstack#22801 → A), the panel on the marketplace package page and in the Studio Access pillar listed pending suggestions only, and an accept was reported as granted whatever the server answered. It now lists every suggestion of the package and draws each one in the state the server records:

- **Pending.** Accept and Dismiss, as before.
- **Pending on the `guest` anchor.** No Accept: the server refuses it with `409`, because the Guest position takes no sets from accepted suggestions. The reason is shown in its place, and Dismiss stays.
- **Accepted.** A Revoke action, which is the existing dismiss call on an accepted row: the server re-derives Everyone without the set. The line says the set was accepted; it does not claim the set is in force, because the list does not say so.
- **Accepted, not yet in force.** An accept answered `200` with `bindingCreated: false` was recorded, but the Everyone position did not change on that request. The panel says so, with a warning toast in place of the success toast, and keeps Revoke. The list does not carry this, so after a reload the row reads as accepted.
- **Dismissed or revoked.** The server records both as `dismissed`. The row says the set is not granted, and offers no action.

A suggestion the deployment's baseline already names (`confirmed` without a deployment decision) is not drawn: this surface does not decide the baseline. A `403` or `409` on Accept, Dismiss or Revoke shows the server's own message, and the panel then reads the list again so it shows what the server holds. A caller without `manage_metadata` is refused the list with `403`, and the panel still renders nothing for them.

**Locale keys.** `marketplace.suggestedBindings.guestUnsupported`, `acceptedState`, `notInForceState`, `dismissedState`, `revoke`, `revoking` and `revokedToast`, in all ten packs. The Studio Access pillar's own table gains the matching `engine.studio.access.suggest…` keys in English and Chinese.

**Clause-②: yes (widening)**: seven locale keys added to `@object-ui/i18n`'s published packs, which widens `TranslationKeys`. No export, prop or accept set moves.
