---
---

Stop instructing the retired `navigation.view` in `packages/plugin-gantt/README.md`,
and extend `readme-navigation-example.test.ts` to measure the paragraph's PROSE and not
only its `json` fence (objectui#9987). No package is released by this change.

Polarity, decided against this gate's own criterion rather than by habit: the changed
README **is** in `@object-ui/plugin-gantt`'s `files[]` and does ship in the tarball, but
`check-changeset-presence.mjs` subtracts `*.md` from published source on purpose —
"published-but-not-code sits with the READMEs" — and the file that actually put this
change in the gate's population is the test under `src/`, which that same header answers
with the empty-frontmatter exemption in one line. No runtime behaviour, no export and no
published contract field moved. Every package here is in one fixed group, so the
corrected README reaches npm with the next release either way.
