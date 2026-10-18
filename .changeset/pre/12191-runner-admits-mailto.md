---
'@object-ui/core': minor
'@object-ui/app-shell': patch
---

A `type: 'url'` action or an `element:button` whose target is `mailto:` now opens the mail client, where it used to fail at click (objectui#12191, the objectui half of ruling A+; the spec half is objectstack-ai/objectstack#23010).

The spec accepts a `mailto:` url target, and app-shell's entitlement CTA already opened one. The action runner refused every scheme but `http(s)` and relative paths, so a mail button published cleanly and then answered "Invalid URL scheme" at click.

- **One answer, two callers.** `@object-ui/core` exports `classifyNavigationTarget(url)` and its `NavigationTargetKind` type. It returns `'web'` (`http://`, `https://`), `'mail'` (`mailto:`), `'path'` (an in-app path, `/…` or `./…`) or `null` (refused). The action runner and app-shell's `resolveCtaHref` both read it, and neither keeps a scheme list of its own. Scheme names compare case-insensitively.
- **`mailto:` navigates in place.** On a `type: 'url'` action, its `navigation` alias and `onSuccess.navigate`, a `mailto:` target sets `window.location.href`. It never opens a new tab, so `openIn` is not consulted. It never goes to the host's navigation handler either: the console's handler would open it in a new tab or route it as a path.
- **The admitted set is closed.** `javascript:`, `data:`, `tel:` and every other scheme stay refused. A protocol-relative `//host` is now refused too; the runner used to hand it to the navigation handler as an in-app path. So are the two spellings a browser reads as `//host`: a backslash right after the first slash, and a target holding a tab, line feed or carriage return.
- **The refusal names the set.** The runner's error now reads "Invalid URL scheme. Only http://, https://, mailto: and in-app relative paths (/path, ./path) are allowed." The `onSuccess.navigate` warning carries the same sentence.
- **Upper-case schemes.** The runner now admits `HTTP://…` and `HTTPS://…` as external URLs and `MAILTO:…` as a mail target; it used to refuse them.
- **app-shell.** `resolveCtaHref` answers as before for `http(s)` URLs, `mailto:` and relative paths, and now also passes a `MAILTO:` URL through as-is. A target the shared answer refuses still takes the control-plane-relative branch, as before.
