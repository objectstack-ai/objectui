---
'@object-ui/console': patch
---

Stop the console's eager stylesheet scanning TEST files for Tailwind classes
(objectui#6379).

`apps/console/src/index.css` declares 27 `@source` path globs across `packages/**`
plus its own tree, and carried no `@source not` line at all — while reaching further
than any other entry in this repo that declares sources. Tailwind v4 scans source
TEXT, not an import graph, so every test file under those globs was a source for the
render-blocking `index-*.css` the console serves: 2373 test files in the packages it
names, plus this app's own. `packages/components/src/index.css` (objectui#8446,
objectui#9569) and `packages/runner/src/index.css` (objectui#8454) already carried the
exclusion; this entry was the gap, and it is the one whose output is render-blocking.

Two repository-root-anchored `@source not` lines close it. The anchor is the one base
that covers BOTH trees this entry scans: the package globs, and Tailwind's automatic
detection root, which is the process CWD — here `apps/console`, where the build runs.

Measured, not assumed: 19 classes and 10,096 raw bytes leave the compiled sheet, and
every one of the 19 was traced to a test file. The built, minified `index-*.css` goes
from 365,214 to 357,216 raw bytes (47,482 to 46,527 gzipped) — -7,998 raw, -955
gzipped. `prose-lg` and `prose-slate` are 10,302 of the unminified bytes on their own — the typography plugin emits a very large
rule block per `prose-*` variant, and both were named by tests and by no shipped
source. The sharpest reading is `mt-[3.7331px]`: the self-hosted sentinel of
components' own `index-css-scan-excludes-tests.test.ts`, a token that exists only to
prove that package's exclusion works, which this app was shipping to users.

This is a correctness fix with a size side-effect, not a first-paint fix. It is 2.0%
of the render-blocking gzipped CSS — about 955 bytes, under 2 ms of transfer on the
4 Mbps profile objectui#6379 measured — and first contentful paint does not move out
of run-to-run noise. The first-paint question in that card is unchanged and still
turns on a product ruling.
