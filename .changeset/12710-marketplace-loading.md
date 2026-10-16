---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

Browse Marketplace says what it is loading, and a failed catalog read names its class and offers Retry (objectui#12710).

The catalog is a remote read. The page drew six skeleton cards for as long as it took, and a network that drops the request left them there forever, with nothing saying what was loading. Now:

- the skeleton stands for at most two seconds of a read; after that one line under the search box reads "Loading the marketplace catalog…", and after ten seconds "Still loading — the marketplace catalog is slow to answer." with a Retry button. A read that answers within two seconds never shows the line;
- a failed read is drawn in the catalog's place: "Failed to load marketplace", then whether the catalog could not be reached (no server answered) or answered with an error (with its HTTP status), the server's own text and, when being online is the cause, the existing hint, with a Retry button;
- Retry issues the same read as the header's Refresh, and a read that answers after a newer one was issued no longer changes the page. The Installed button and the "Your organization" packages stay usable while the catalog has failed.

New `marketplace.load.*` strings (`loading`, `slow`, `retry`, `unreachable`, `answeredError`) are in all ten language packs.
