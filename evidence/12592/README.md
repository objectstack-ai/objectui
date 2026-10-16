# objectui#12592 item 3 — browser and unit readings

Console from `claude/issue-12592-section-density` (after) and from `efa9cb4fa` (before),
against the showcase app on published `@objectstack/*@18.0.0-next.2`
(`e2e/live/ci/start-backend.sh`). HotCRM was not reachable from the container.

- `before-*.png` / `after-*.png`: wizard page `showcase_new_project_wizard` (WizardForm,
  undeclared sections), `showcase_semantic_zoo/new` (ObjectForm, fieldGroup sections),
  the `showcase_semantic_zoo` New dialog (ModalForm), and `showcase_task/new`
  (declared `columns: 2`), at 1440 and 390.
- `read-before.json` / `read-after.json`: per field, grid track count, the `@container`
  width and the field width.
- `before.md` / `after.md`: the rendered per-row count (`@md / @2xl / @4xl`) of an
  undeclared section, per host, from a jsdom harness over the real renderer.
