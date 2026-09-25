---
'@object-ui/console': patch
---

An app's own favicon no longer turns into the operator favicon after an in-app
navigation (objectui#10379). This is the favicon twin of the tab-title race that
objectui#8637 fixed.

Two effects wrote the icon link, keyed on different inputs. The console's
`FaviconSync` was keyed on `useLocation()` and wrote the operator favicon (the
runtime config's `branding.faviconUrl`) on **every route change**.
`useAppShellBranding` writes the active app's `branding.favicon` from an effect
keyed on that URL, so it fires when the app's branding changes and not on
navigation. With an operator favicon configured, moving between two pages of the
same app ran only the route-keyed writer, and the operator's icon replaced the
app's until the user left the app.

The repair is one writer, the same as for the title. `FaviconSync` no longer
writes the favicon, and it now writes nothing at all. Nothing else needed to
change: the operator favicon is on the icon link before React mounts, written by
the pre-boot script in `index.html` and by `main.tsx` from a runtime config that
`main.tsx` awaits before the first render. Since objectui#10040 the shell also
captures the icon it finds and restores it when it unmounts. So inside an app
with its own favicon the tab keeps that favicon, and leaving the app shows the
operator favicon again. An app without its own favicon shows the operator
favicon throughout, and a deployment with no operator favicon is unaffected.
