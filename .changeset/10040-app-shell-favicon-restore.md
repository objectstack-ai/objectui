---
'@object-ui/layout': patch
---

`useAppShellBranding` now puts the previous favicon back when the shell unmounts
(objectui#10040), the same way it already puts the previous tab title back
(objectui#8637).

The hook's effect makes two branded writes to the document: `document.title` and the
`href` of the page's icon link. The title write was scoped to the mount; the favicon
write was not, so a branded `favicon` stayed on the icon link after the shell went
away unless something else happened to re-apply an icon. In the console that something is
`FaviconSync`, which only writes when an operator favicon is configured — so on a
deployment without one, the icon link kept a branded app's URL after the user left
the app.

When `branding.favicon` is set and the page has an icon link (`#favicon`, otherwise
`link[rel="icon"]`), the hook now records that link and its `href` attribute before
writing the branded URL, and restores the recorded attribute in the same cleanup that
restores the title — so switching from one branded app to another and then leaving
puts back the icon from before the first one. The attribute is captured rather than
the `href` property, because the property resolves an empty `href=""` (the console's
icon link before an operator favicon exists) to the page's own URL; an icon link that
had no `href` attribute is left without one. A shell with no `favicon`, or a page with
no icon link, is untouched in both directions, and the hook still never creates an
icon link.

As with the title, the restore replays the captured value unconditionally: an icon
written by something else while the shell is mounted is overwritten when it unmounts.
