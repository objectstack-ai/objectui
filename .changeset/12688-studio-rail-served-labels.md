---
'@object-ui/app-shell': patch
---

Studio's Interfaces rail shows the app's navigation in the session's language (objectui#12688).

On a zh-CN session the rail read the authored English labels ("Capability Map", "Page Authoring", "Workspace") while the runtime sidebar on the same session read the translated ones (能力地图, 页面搭建, 工作区). The rail drew its rows from the nav editor's buffer, the app's draft or its `/layers` code layer, and the server localizes neither: app-navigation localization is done once, by the server's `/meta` read.

The Studio already lists the package's apps through `/meta`, and the server answers that read translated. The rail now draws, for each navigation entry, the label that answer serves, matched by the entry's `id`, and the rail heading draws the served app label the same way. The leaf the rail opens is captioned with the text its row shows. An entry changed or added in the app's draft shows its authored label, as before, because the served answer does not describe it yet.

Display only. The nav editor's cards, the nav-item inspector's Label field and a source page's list of nav entries keep reading the authored label, so an edit never writes a translated text into the app. An English session reads as before.

Nothing is added to the package entry: no export, prop, type member or language-pack key.
