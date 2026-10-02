---
'@object-ui/cli': minor
---

**BREAKING (`@object-ui/cli`):** the `objectui add` command is retired, and so are `objectui analyze`'s two flags, `--render-performance` and `--bundle-size`. There is no alias window and no placeholder: the CLI now refuses `add` as an unknown command and each flag as an unknown option (objectui#11496).

(The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

- FROM `objectui add COMPONENT` TO nothing: drop the call. No renderer download or scaffold exists, so there is nothing to replace it with.
- FROM `objectui analyze --render-performance` TO nothing: drop the call. It analysed nothing; it printed the same fixed list of tips in every directory.
- FROM `objectui analyze --bundle-size` TO `objectui analyze`: drop the flag. The bundle-size report is now all `analyze` does.

**Why.** `add` was declared ("Add a new component renderer to your project") and documented with an example, but its action printed "Feature not implemented yet.", wrote nothing and exited 0, so a script or CI step read the no-op as success. No producer of the command was measured, and downloading renderer source into a project would be a new capability with no pull, so the command goes instead. Checking every other command and flag the CLI declares turned up one more no-op: `analyze --render-performance` printed fixed text, byte for byte the same in an empty directory and in a built project, and exited 0. It goes the same way. `--bundle-size` only chose between that section and the bundle report; with one analysis left it would be read by nothing, which is why `generate --output` was retired, so it goes too.

**What changes at the command line.** `objectui add Input` now exits non-zero with commander's unknown-command error and writes nothing. `objectui analyze --render-performance` and `objectui analyze --bundle-size` exit non-zero with the unknown-option error. `objectui analyze` with no flag prints the bundle-size report of `dist/` exactly as before, without the fixed render-performance section. `objectui --help` no longer lists `add`, `objectui analyze --help` lists no flags, and the CLI docs and the package README drop the `add` section and the `analyze` flag table.

**Clause-②: yes.** The published CLI's accept set narrows: a command and two options it used to accept are now refused. No exported symbol moves; `analyze` is not part of the package's exports.
