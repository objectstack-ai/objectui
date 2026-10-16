---
'@object-ui/console': patch
---

The developer Public Forms page offers each public form's real anonymous URL (objectui#11769).

The page built the link, the copied URL, the iframe snippet and the React snippet as `ORIGIN/console/f/SLUG`, and printed `/console/f/` beside both slug fields. No host serves the console at `/console/`: the framework CLI and cloud mount it at `/_console/`, and a framework-served console answers `/console/f/SLUG` with a 404. The page now asks the console router where its anonymous route `/f/:slug` is served, so it offers `ORIGIN/_console/f/SLUG` under a `/_console` mount and `ORIGIN/f/SLUG` on a root-mounted console. The link, the copied URL, both snippets and both slug-field prefixes show the same address.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
