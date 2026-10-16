---
'@object-ui/console': minor
---

The console's login page follows the approved "refined centred" artboard (objectui#12600).

- **One accent.** The brand tile above the card and the soft glow behind it take the theme's `--primary`, the token the form's button and links already used, so the page no longer shows an indigo mark beside the console's own hue. The glow is `--primary` at 10 % in both themes.
- **The depth layer shows.** The dot grid and the glow were painted beneath the page's own background and never appeared; the auth shell is now its own stacking context, so they render behind the card.
- **One 400 px column:** brand mark, card, footer, 20 px apart. The card (`rounded-xl`, 1 px border, 28 px padding, 20 px at the bottom) carries the page's own header, "Welcome back" and one line "Sign in to continue your work", in place of the form's lock tile and two-line header.
- **The dev-admin banner retires.** On a development instance whose `/auth/config` reports `devSeedAdmin`, the card's last row reads "Local development instance" with a chip, "Sign in as dev admin", that signs in with the reported credentials through the same `signIn` the form uses. The password is never rendered. The row has no dismiss button and stores nothing in `localStorage`.
- **A footer** under the card: the locale switch, and privacy and terms links when the server's auth config serves `features.privacyUrl` / `features.termsUrl`. A URL that is neither `http(s)` nor a same-origin path renders no link.

`?redirect=`, the SSO hand-off, the server-unreachable panel, the server-driven product name and logo, and the sign-up rule are unchanged.
