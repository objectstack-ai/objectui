---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

The marketplace consent panel no longer promises confinement the runtime does not provide.

`PluginDisclosure` introduced a code-bearing package's structured permission set with "On install, this package will be granted:". A list of grants on a security panel is read as a confinement promise — the complement assumed denied — and on this platform it is not. The consented set is persisted (`sys_package_installation.granted_permissions`), re-confirmed on a widening upgrade, and registered on the runtime's `PluginPermissionEnforcer` at load; it is queried by nothing, because `SecurePluginContext` has zero production construction sites and the fs/network gates have no caller at all (measured on objectstack `9bd4344e4`; objectstack#17147).

`marketplace.disclosure.grantsIntro` now states a REQUEST — "This package requests:" — and a new `marketplace.disclosure.notEnforced` line beside the list says the set is recorded at install, re-confirmed if a later version asks for more, and not yet a runtime restriction. Both land in all ten locale packs; the `ja` value stays predicate-final so that pack's halfwidth-colon rule still decides it.

The trust-tier badge is deliberately untouched: it is objectstack#11330's half of the same panel.
