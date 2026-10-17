# objectui#12725 — live readings

Studio › ObjectStack Showcase (`com.example.showcase`, read-only) › Interfaces, on a backend booted with
`e2e/live/ci/start-backend.sh` (published `@objectstack/*@18.0.0-next.2`), at 1010 and 1280 px.

- `before-*` — objectui `main` `4b3d6ed`; `after-*` — branch `claude/issue-12725-studio-right-slot`.
- `*-copilot-*` — the browser stubs `GET /api/v1/ai/agents` with one `build` agent: the community backend
  answers `{"agents":[]}`, so with no stub no copilot renders (`*-noai-*`: the slot holds the properties alone).
- Per width: `-a` (landing leaf), `-dashboard` (Delivery Operations open), `-selected` (the Active Projects
  widget clicked), `-esc` (after Esc).
