---
'@object-ui/app-shell': minor
---

Studio's Access pillar shows an open permission set as an item header and five tabs (objectui#12456, epic objectui#12446 decision C).

- **The header carries the set.** The set's label, its api name as a mono chip, a Package chip, "N objects granted · M field overrides", then Explain access, History and a more menu. The more menu opens the name and label editor. The breadcrumb row, the badge row and the collapsible set header are gone from Studio.
- **Five tabs instead of one scrolling page.** Objects (the landing), System capabilities, Row-level security, Tab visibility and Delegated admin. Each tab holds the section the page used to stack. Every tab stays mounted while another is open, so a malformed row-level-security expression still holds the autosave from any tab.
- **The object matrix is restyled.** A toolbar with the object count, the filter, "Only granted" and a short legend. A flush table with a tinted header, 40 px rows, the OWD as a tinted chip (Private muted, public green, by parent blue), 18 px checkboxes, and dividers between the CRUD and sharing groups. The R · CRUD · All · None strip appears only on the row under the pointer or the row holding keyboard focus. The rail's permission-set rows are 36 px with the api name on a second line.
- **The Record sharing overview** takes its title from the pillar's item header. Its own header row now holds its description and Save.

Writes are unchanged: the same cells, the same bulk actions, the same autosave, read-only gates and destructive-change dialog. Setup's permission page uses the same editor and is unchanged, because the Studio presentation is a new `studio` prop that only the Access pillar passes.
