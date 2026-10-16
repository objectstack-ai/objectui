---
'@object-ui/app-shell': patch
---

Studio Data pillar, Form tab: one compact toolbar row and card-style sections and fields (objectui#12451).

- **One toolbar row** under the object's tab row, in Layout and in Preview: a compact Layout / Preview control, a hint ("Drag fields to arrange · click a field to edit its properties"), and in Layout "Add group" (outline) and "Add field" (primary-soft) at the right. The caption that used to trail the control ("Draft layout", "Preview of the published version", and their read-only and unsaved-changes forms) is now each item's title. Add field is the same action the object header's More menu runs.
- **Canvas** on the sidebar surface with 24 px padding and 16 px between sections, flush with the content column.
- **Section card**: a 44 px header with the section title, its field count, the move and delete controls, and the section settings button at the right; an 8 px-gap field grid whose column count still follows the runtime form's rule.
- **Field card**: a borderless card that shows a border on hover; a 13 px label with a red asterisk when required, a 10 px uppercase type tag, and a skeleton control (32 px; 56 px for multi-line types; a select box with a chevron for pickers). Selected: a primary border with a soft primary ring, and the type tag turns primary.
- **Footer**: a dashed "Add group" button under the last section.

Drag-and-drop, keyboard reordering, their announcements, and field selection opening the field inspector are unchanged. One new string in the metadata-admin designer's own table (en and zh); no export, prop of a published component, or language-pack key changes.
