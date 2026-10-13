---
'@object-ui/plugin-dashboard': patch
---

A dashboard header action of type `url`, or of no declared type, now goes through the action runner, like every other header action (objectui#12275).

The click used to navigate by a url check of its own and never reached the runner's `classifyNavigationTarget`, which decides what a click may open (ruling A+ on objectui#12191). So:

- **A protocol-relative `//host` target is refused at the click.** It used to be opened with `location.assign`. A bare relative value such as `thanks` is refused too; it used to be pushed as a route. Under the console the runner's error toast reports the refusal; with no action provider the dashboard logs it.
- **A `mailto:` target opens the mail client in place.** It used to throw in `history.pushState`.
- **A header action with no `actionType` runs as a `url` action.** The contract and the dashboard's own action list read an omitted type as `url`, but the click dropped it with a "missing actionType" warning, so the button did nothing.
- **An `https://` target opens the way every runner `url` action opens one**: through the host's navigation handler, which in the console opens it in a new tab. It used to replace the current page.
- **An in-app path such as `/apps/...` still navigates in the app**: through the host's router under the console, and, with no action provider, by the same history push as before.

Following a `url` header action raises no success toast, as before.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
