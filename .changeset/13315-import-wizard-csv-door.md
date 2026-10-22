---
'@object-ui/plugin-grid': patch
'@object-ui/app-shell': patch
---

The Import Wizard sends a CSV file to the import door as CSV text (objectui#13315). When you import a `.csv`, `.tsv` or `.txt` file, the request is now `format: 'csv'` with the rows the preview shows written out as CSV. This holds on the hand-mapped path, and with a saved mapping that does not declare `sourceFormat: 'json'`. Before, those rows were sent as JSON, so the server never read the file's cells through its CSV import rule, the one its CSV export pairs with.

- **The text is the preview's rows.** The wizard writes the CSV from the rows it shows, not from the file as uploaded, as it already did for a mapping that declares `sourceFormat: 'csv'`. A cell you corrected in the preview is sent corrected. The dry-run check sends the same request as the import.
- **Unchanged:** an `.xlsx` sheet and a pasted table are sent as JSON rows. A saved mapping that declares `sourceFormat: 'json'` still gets JSON rows from any file, because the import door does not accept CSV text for it.
- **User import** (`sys_user`) sends a CSV file as CSV text too, in batches of at most 500 rows. Each one-time password is still shown with the email or phone number of its row.

Three shapes now import differently from what the preview shows:

- **A last row whose mapped cells are all empty is not imported.** When the file's last row, or a run of last rows, has data only in columns you did not map, the server does not read it. The import counts one row fewer than the preview, and that row creates no record and reports no error. A row of that shape anywhere else in the file is imported as before, so row numbers keep matching the preview. User import sends the file in batches of 500 rows, so there the same holds for the last row of each batch.
- **A cell that begins with an apostrophe and ends in a tab or a line break keeps the apostrophe** when the rest of it starts with `+` or `-` and holds only digits, spaces and `( ) + - . ,`. The preview trims the tab or line break before the cell is sent, and a server whose CSV import removes the apostrophe the CSV export adds leaves this trimmed cell as it is. The wizard imported such a cell with its apostrophe before this change too.
- **A space before a leading apostrophe is trimmed first.** On a server whose CSV import removes the apostrophe the CSV export adds, a cell typed as a space, an apostrophe and a value the export would write with an apostrophe now imports without the apostrophe. Before this change it imported with it.

No export, prop or type is added to either package entry.
