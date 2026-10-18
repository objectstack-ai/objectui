---
'@object-ui/app-shell': patch
---

The ⌘K command palette closes after every command it runs, including one that does not navigate (objectui#12683).

Running **Dark Theme**, **Light Theme** or **System Theme** from the palette applied the theme but left the palette open, with `?palette=1` still in the URL. The palette ran each command through a memoised `runCommand` with no dependencies, so it kept the palette's first-render `setOpen`, and that `setOpen` judges whether the palette is open from the URL of that render:

- **Opened after the page loaded** (the header Search button, ⌘K): that URL had no `?palette=1`, so closing was a no-op and a theme command left the palette open. A navigating command only seemed to close it, because the navigation replaced the URL, and Back then reopened it.
- **Opened by the `?palette=1` deep link**: closing did act, but with that render's router state. After a navigating command, a theme command run from the next page sent the user back to the page the palette was first opened on.

`runCommand` is now a plain function, so it calls the current `setOpen`. After any palette command the palette closes and `?palette=1` leaves the URL. A theme command keeps you on the page you are on. A navigating command still lands on its route and still adds one history entry. Back now returns to the page you ran it from with the palette closed; it used to reopen the palette there.

Nothing on the package entry changes: no export, prop or type. `useUrlOverlay` is unchanged.
