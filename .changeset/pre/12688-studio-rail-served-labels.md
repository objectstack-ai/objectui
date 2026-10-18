---
'@object-ui/app-shell': patch
---

Studio's Interfaces rail and the dashboard component list show the app's navigation and the widget titles in the session's language (objectui#12688).

On a zh-CN session the rail read the authored English labels ("Capability Map", "Page Authoring", "Workspace"), while the runtime sidebar on the same session read the translated ones (能力地图, 页面搭建, 工作区). The dashboard property panel's component list read "Task Count vs Avg Progress" where the served dashboard reads 任务数与平均进度. Both surfaces draw from the editor's buffer: the item's draft, or else its `/layers` code layer. The server localizes neither of those. It localizes metadata once, in its `/meta` reads.

The Studio already holds those `/meta` answers. The pillar lists the package's apps through `/meta`, and the console's metadata store holds the `/meta` dashboard list. The server answers both translated. Three surfaces now take their text from those answers:

- **Rail rows.** Each navigation entry draws the label the served app gives it, matched by the entry's `id`. The leaf the rail opens is captioned with the text its row shows.
- **Rail heading.** It draws the served app label.
- **Component list.** Each widget draws the title the served dashboard gives it, matched by the widget's `id`.

An entry or widget changed or added in the draft shows its authored text, as before, because the served answer does not describe it yet. To make that comparison for a published dashboard that has a pending draft, the Studio reads its published layer once.

This changes display only. The nav editor's cards, the nav-item inspector's Label field, a source page's list of nav entries, and the widget inspector's Title field keep reading the authored text, so an edit never writes a translated text into the source. The dashboard canvas is unchanged, and an English session reads as before.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
