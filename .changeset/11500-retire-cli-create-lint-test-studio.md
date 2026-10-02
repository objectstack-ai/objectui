---
'@object-ui/cli': minor
---

**BREAKING (`@object-ui/cli`):** four commands are retired: `objectui create`, `objectui lint`, `objectui test` and `objectui studio`. There is no alias window and no placeholder: the CLI now refuses each as an unknown command (objectui#11500).

(The bump is `minor` by this repo's release model: objectui's major follows the `@objectstack` family major, and its own breaking changes ship as `minor` with the breaking semantics stated here.)

- FROM `objectui create plugin NAME` TO `npm create @object-ui/plugin NAME`, the package's own initializer (`@object-ui/create-plugin`). `plugin` was the only type `create` accepted, so `create` itself goes.
- FROM `objectui lint` and `objectui test` TO your project's own ESLint and Vitest (or whichever linter and test runner it declares), run directly.
- FROM `objectui studio` TO nothing published. Contributors to the objectui monorepo run `pnpm --filter console dev`.

**Why.** Each of the four could only fail. `create plugin` looked for its generator one directory too high, so it exited 1 with a "Cannot find module" error in a checkout and in an installed copy alike, and wrote nothing. `lint` and `test` ran ESLint and Vitest inside the temp app `objectui dev` generates, which declares neither tool and has no lint config and no tests, so they failed on every run, and they reported the setup error as lint findings or failed tests. `studio` started this monorepo's console app rather than the local project its documentation promised, and outside the monorepo it exited 1 with "Console app not found in workspace".

**Corrected alongside, each to what the command does:**

- `objectui analyze` with no `dist/` directory now exits non-zero with an error naming the missing `dist/`. It used to print a warning, then "Analysis complete", and exit 0.
- `objectui init NAME --template UNKNOWN` now refuses the template before it creates the `NAME` directory. It used to exit 1 and leave an empty `NAME` directory behind, which the next `init NAME` then refused as already existing.
- `objectui doctor`'s help no longer says it fixes issues. It reports and changes no file. The CLI docs no longer promise a Node version check it never ran.
- The CLI docs no longer say `objectui serve` lacks `--no-open`. It has always accepted it, as `dev` does.

**What changes at the command line.** `objectui create plugin my-widget`, `objectui lint`, `objectui test` and `objectui studio` now exit non-zero with commander's unknown-command error and write nothing. `objectui --help` no longer lists them. The CLI docs and the package README drop their sections, and the docs name the plugin initializer.

**Clause-②: yes.** The published CLI's accept set narrows: four commands it used to accept are now refused, and `analyze` without `dist/` now exits non-zero. No exported symbol moves; none of these commands is part of the package's exports.
