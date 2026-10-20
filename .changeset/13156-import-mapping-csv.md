---
'@object-ui/plugin-grid': patch
---

The Import Wizard sends a saved mapping the format the mapping declares (objectui#13156). A mapping that declares `sourceFormat: 'csv'` is now imported with `format: 'csv'`, the rows as CSV text and `mappingName`, which is the request the import door accepts for it. Before, the wizard always sent JSON rows. The door refused them with `400 MAPPING_FORMAT_MISMATCH`, so a shipped CSV mapping imported nothing.

- **The text is the preview's rows.** The wizard writes the CSV from the rows it shows, not from the file as uploaded. A cell you corrected in the preview is sent corrected. A tab-separated file, a pasted table and an `.xlsx` sheet are sent as CSV text too, so a CSV mapping never receives JSON rows.
- **The dry-run check sends the same request** as the import, so it checks exactly what the import will write.
- **Other mappings are unchanged.** A mapping that declares `sourceFormat: 'json'`, or declares no format, still gets JSON rows. Hand-mapped imports are unchanged.

The wizard reads `sourceFormat` from the mapping the server serves. It never guesses it from the file name. No export, prop or type changes.
