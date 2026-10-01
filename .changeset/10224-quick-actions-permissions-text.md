---
'@object-ui/plugin-detail': patch
---

fix(plugin-detail): `record:quick_actions.requiredPermissions` publishes what the gate does — the contract's shared record-block describe, verbatim

The `record:quick_actions` registration described `requiredPermissions` as "Hide
the whole bar unless the user holds these permissions". The renderer does not
hide the bar. It reads the ADR-0066 capability set, and when a declared
capability is missing it draws an insufficient-permissions notice where the bar
would be. When the client cannot resolve capabilities (no permission provider,
or a backend that does not report `systemPermissions`) it renders the bar.

`@objectstack/spec` 17.5.0 gives this key one describe, shared with
`record:details`, `record:highlights` and `record:related_list`, and those three
already publish it. The quick-actions input now publishes the same text. It is
carried by `sdui.manifest.json`, and at runtime by
`ComponentRegistry.getConfig('record:quick_actions').inputs`. No input name,
type or shape changes, and no rendering or gating behaviour changes.
