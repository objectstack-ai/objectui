---
'@object-ui/app-shell': patch
---

Setup → Installed Apps is titled "Installed Apps" and says when no app is installed from the marketplace yet (objectui#13356).

The Installed Apps entry opens the Packages page filtered to marketplace installs (`?source=marketplace`). That view now carries the entry's title instead of "Packages", and with no marketplace install it reads "No apps installed from the marketplace yet" instead of "No packages match your filters.", which blamed a filter the administrator had not set. "No packages match your filters." stays for a filter the viewer did set: a search that hides the marketplace installs that exist, or another Source. Setup → Packages, opened without a Source, is unchanged. English and Chinese.
