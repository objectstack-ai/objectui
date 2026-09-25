---
'@object-ui/layout': patch
'@object-ui/console': patch
---

The console tab title no longer reverts to the bare product name after an in-app
navigation (objectui#8637).

Two effects wrote `document.title` on different keys. The console's `BrandingSync`
was keyed on `useLocation()` and assigned the bare product name on **every route
change**; `useAppShellBranding` assigns the composed `"App label — Product name"`
from an effect keyed on that string, so it fires when the title changes and not on
navigation. Both run on the commit that mounts the shell, and the composed title
wins — which is why the tab looked right and the defect stayed hidden. Navigating
between two pages of the same app moved `location` and not the composed title, so
only the route-keyed writer ran and the tab fell back to the bare product name.
Measured in a real browser, not inferred.

The repair is one writer rather than two careful ones. `useAppShellBranding` now
owns `document.title` for as long as a shell is mounted: it captures whatever the
tab already said, writes `title` over it, and puts the captured string back when the
shell unmounts or `title` changes. That is what let the console's route-keyed writer
drop its title assignment entirely — it had doubled as the reset that took the app
label back off the tab on the way out — and it became `FaviconSync`, which kept only
the favicon write until objectui#10379 removed that too.

For hosts of `@object-ui/layout`: the forward assignment is unchanged, and a shell
with no `title` still leaves the tab untouched in both directions. What is new is the
restore, so a shell mounted over part of a route tree hands the title back on exit
instead of stranding it. The restore replays the captured string unconditionally, so
a surface that writes the tab title from **inside** a mounted shell has its value
overwritten on unmount; keep such surfaces outside the shell.
