---
'@object-ui/cli': minor
---

**BREAKING (`@object-ui/cli`):** `objectui generate` no longer accepts `--output`. The flag is retired, with no alias window, and the CLI now refuses it as an unknown option (objectui#11476).

(The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

- FROM `objectui generate TYPE NAME --output DIR` TO `objectui generate TYPE NAME`: drop the flag. Files are written in the generator's per-type layout under the current directory, e.g. `pages/NAME.json`.

**Why.** The flag was declared (documented default `schemas/`) and documented, but nothing read it. The action called `generate(type, name)` without it, so a run with `--output custom/` exited 0, wrote `pages/NAME.json`, and created no `custom/` directory. Its documented default was not even where the generator writes. Honouring it would have meant inventing and testing an output layout for every resource type, with no measured user, so the flag goes instead.

**What changes at the command line.** `objectui generate page NAME --output DIR` now exits non-zero with commander's unknown-option error and writes nothing. Without the flag, `generate` writes exactly where it wrote before. `objectui generate --help` no longer lists `--output`, and the `generate` flag table in the CLI docs drops its row.

**Clause-②: yes.** The published CLI's accept set narrows: an option `generate` used to accept (and ignore) is now refused. No exported symbol moves.
