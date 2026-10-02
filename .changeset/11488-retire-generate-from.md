---
'@object-ui/cli': minor
---

**BREAKING (`@object-ui/cli`):** `objectui generate` no longer accepts `--from`. The flag is retired, with no alias window and no placeholder, and the CLI now refuses it as an unknown option (objectui#11488).

(The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

- FROM `objectui generate TYPE NAME --from SOURCE` TO `objectui generate TYPE NAME`: drop the flag. No import from an external source (OpenAPI, Prisma) exists, so there is nothing to replace it with; `generate` scaffolds the resource in the generator's per-type layout under the current directory, e.g. `pages/NAME.json`.

**Why.** The flag was declared ("Generate schema from external source (openapi.yaml, prisma.schema)") and documented as *experimental*, but no importer was ever built. A run with `--from openapi.yaml` printed "not yet implemented", exited 0 and wrote nothing, so a script or CI step read the no-op as success. No producer of the flag was measured, and building an OpenAPI or Prisma importer would be a new capability with no pull, so the flag goes instead.

**What changes at the command line.** `objectui generate page NAME --from SOURCE` now exits non-zero with commander's unknown-option error and writes nothing. Without the flag, `generate` behaves exactly as before. `objectui generate --help` no longer lists `--from`, and the `generate` section of the CLI docs drops its flag table, which `--from` was the last row of.

**Clause-②: yes.** The published CLI's accept set narrows: an option `generate` used to accept (and answer with a no-op that exited 0) is now refused. No exported symbol moves.
