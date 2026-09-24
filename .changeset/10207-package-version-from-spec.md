---
'@object-ui/app-shell': patch
---

The package dialog judges a version with the installed `@objectstack/spec`'s own `ManifestSchema` version field instead of a hand-copied regex, so it accepts exactly what the spec accepts. No change on spec 17.4.0; once a spec release adopts the SemVer 2.0.0 canon (objectstack#18697), prerelease and build versions such as `2.0.0-beta.1` are accepted without a change here.
