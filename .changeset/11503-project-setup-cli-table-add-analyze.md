---
---

Skill prose only, no package released: the CLI command table in
`skills/objectui/guides/project-setup.md` no longer lists `objectui add`, and its
`objectui analyze` row now says what the command does today — the bundle-size report over the
built `dist/` output. PR objectui#11499 (objectui#11496) retired the `add` command and the
`--render-performance` / `--bundle-size` modes of `analyze`, while the shipped skill kept
teaching both, so an agent following the guide would run a command the CLI refuses as unknown
and name a mode it no longer has. The other table rows and the rest of the guide are unchanged
(objectui#11503).
