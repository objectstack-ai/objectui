---
'@object-ui/console': patch
'@object-ui/runner': patch
---

The console and runner stylesheets compile only from their declared `@source`
lines. Tailwind's automatic source detection is now off (`source(none)`), as it
already was for `@object-ui/components`.

With detection on, Tailwind also scanned prose in each package's directory, and
`CHANGELOG.md` was part of it. A release writes every changeset body into that
file, so the release itself added utilities to the published CSS that no
component uses. On the 17.7.0 release head, that was 11 rules (about 9 kB) in the
console sheet and 5 in the runner sheet. Both sheets now compile to the same
rules wherever the build runs. The only rules dropped against the previous
build came from prose: one from a docs proposal in the console and two from
the runner's changelog.
