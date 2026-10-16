# objectui#12611 — Studio at 1024 px: evidence

Evidence branch only; never merged (the maintainer's ruling: screenshots do not enter main).

Captured from the feature branch `claude/issue-12611-studio-1024` at `dfbb125`, the vite console against a local
HotCRM backend (`objectstack dev --fresh`, HotCRM `63db83e`), read-only package `app.objectstack.hotcrm`, Chromium
headless, en. Viewports: 1024 x 768 (light and dark) and 1280 x 900 (light).

| File | What it shows |
|---|---|
| `after-data-*.png` | Data pillar: the app chip reads "HotCRM 🔒 Read-only" whole. |
| `after-automations-*.png` | Automations, flow "Enroll Members in Campaign": the title whole; at 1024 the meta has folded and the tab row scrolls, faded at its end. |
| `after-access-*.png` | Access, set "Guest (Public Forms)": the five tabs on one 36 px line; at 1024 the row scrolls, faded at its end. |
| `after-interfaces-*.png` | Interfaces, dashboard Home: at 1024 the folded "Canvas / Properties" toggle with the Properties dot, the canvas on a 16 px gutter. |
| `after-data-chip-700-light.png` | The chip on a 700 px window (header column 252 px): the word folded, the lock kept, the name whole. |
| `readings-after.json` | The DOM readings taken with each capture. |
