---
'@object-ui/app-shell': minor
---

Studio Interfaces pillar: the rail is the app's navigation tree as the running sidebar draws it, the "+" offers every nav kind, and the header, tab row and nav-item inspector follow the redesign artboards (objectui#12455, epic objectui#12446).

- **Rail.** One 32 px row per entry: its icon (the entry's own, else the object's metadata icon, else the kind's glyph), its label, and its kind as an uppercase tag (Dashboard, Page, Object, View for an object entry bound to a named view, Report, Link, Action, Component, Doc). Groups are collapsible headers, open or closed as the sidebar opens them (the spec's `expanded`, else open unless the group is long, and always open around the open entry); children are indented; an empty group reads "No items in this package"; separators stay decorative rules. The machine name moves from a second line under the label to the row's tooltip, beside the type, where it already was.
- **"+" kind picker.** The rail's add button lists the ten nav kinds the spec declares, each with its glyph, name and one line on what it opens. Page, Dashboard and Report continue into the existing create dialog; every other kind adds its entry (unbound where it has a target, so the save leaves it out until one is picked) and opens it in the nav-item inspector.
- **Item header and tab row.** The tile shows the open entry's icon and the chip its kind; Design / Run is a 26 px segmented control with pencil and play glyphs, followed by a divider and a properties toggle that carries `aria-pressed` and is the one control that opens and closes the aside. An object entry offers "Open in Data" (through the Studio's surface channel) and a Preview tab with the runtime-list note; other entries show a Canvas tab. The internal `type · name` pair stays on the title's tooltip (objectui#7254).
- **Nav-item inspector.** The aside's header reads "Nav item · KIND", the entry's label and its nav id. The inspector adds an Icon picker (the console's icon picker), shows the entry's `visible` predicate read-only under "Visible when", and offers "Remove nav item".

Nothing is added to the package entry: no export, prop or type member changes, and no language-pack key. The new copy lives in the metadata-admin designer's own string tables (en and zh).
