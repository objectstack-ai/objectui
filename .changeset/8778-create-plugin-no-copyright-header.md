---
'@object-ui/create-plugin': patch
---

create-plugin: stop writing an "ObjectStack Inc." copyright header onto the plugin author's own source files

`buildIndexFile`, `buildImplFile`, `buildTypesFile` and `buildTestFile` — the
four builders that write source into the scaffolded package — each opened the
file they emit with `Copyright (c) <year>-present ObjectStack Inc.` under an
`ObjectUI` title line. Those four files are the author's own code: the package
entry, the component implementation, its schema types and its example test. The
notice named this project as the copyright holder of source the author had not
written yet, in a package they publish under their own name — a stronger claim
than the licence one objectui#8041 removed, which asserted a licence *choice*
rather than *ownership*.

Both lines are gone and **nothing replaces them**. A scaffolded `src/*` file now
carries no copyright line, no holder, no year and no SPDX id — not even the
author's own name, which would be this generator making a legal assertion about
the author's code just as the old line did.

What stays is the licence pointer, because it is true: `This source code is
licensed under the <id> license found in the LICENSE file in the root directory
of this source tree.` The id is the licence the author chose at the prompt
(objectui#8041), the LICENSE it points at really is emitted beside those files,
and `buildLicenseFile` refuses an id it has no text for (objectui#8892) — so it
cannot name a licence the package does not carry. It also remains one of the six
agreeing licence statements those two cards built, alongside the manifest and
the README.

No prompt, no manifest field and no other emitted file changes.
