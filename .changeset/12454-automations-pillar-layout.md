---
'@object-ui/app-shell': minor
---

The Studio's Automations pillar takes the redesign's layout (objectui#12454, epic objectui#12446).

- **The rail groups flows by the object each one is about**, in the order of the objects' labels, with a count per group and a trailing "No object" group. The object is read off the flow's own definition as the metadata list serves it: the Start node's object, else the first data node of the flow on one of the package's objects, else the first record it writes. Groups fold; a search filters within them.
- **Each row** carries a glyph for its trigger kind (record-triggered, scheduled, screen, autolaunched), its label on one line (the row's title holds it whole, with its kind and status), and a 6 px status dot (green On, grey Not running here, amber Refused, a hollow ring Off). A legend under the rail names them.
- **The item header** carries the flow's Trigger, Status, Run as and version, the meta the canvas's info bar used to show, and the Enabled switch, whose title carries "Off by default · review before enabling".
- **A tab row** — Canvas, Variables, Runs, Problems (with its count) and Debug — replaces the info bar's buttons. Variables, Runs and Problems open as the tab's body; picking a problem opens the canvas on its element. Debug keeps the canvas beside the simulator.
- **The canvas** sits flush under the tabs on the sidebar surface with a 20 px dot grid, and its zoom control floats at the bottom right; the metadata-admin designer's flow preview shares the canvas look and keeps its info bar.
