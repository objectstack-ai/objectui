---
'@object-ui/types': minor
'@object-ui/data-objectstack': minor
'@object-ui/plugin-grid': patch
'@object-ui/i18n': patch
'@object-ui/app-shell': patch
---

The import wizard's "Download template" button now downloads the server's import template, an Excel workbook, instead of building a CSV of every field (objectui#9600).

The old CSV listed every field the wizard was handed, including the system and read-only columns every object carries (created by, owner, and so on). The server strips those columns on import without an error, so a user who filled them in lost that data silently. The server's template (`GET /api/v1/data/:object/export?template=true`, objectstack 17.6.0) lists only the columns this caller can import. It marks required ones with `*`, adds dropdowns for select and boolean columns, and includes an instructions sheet.

- **`@object-ui/types`: new optional `DataSource.downloadImportTemplate(resource)`**, resolving to the template file as a `Blob`. Additive. When a data source lacks it, no template is offered: there is no client-side fallback.
- **`@object-ui/data-objectstack`: `ObjectStackAdapter.downloadImportTemplate(resource)`** sends `template=true` on the export route, on the same request path as `exportDownload`. When the client has a locale set (`getClient().setLocale`), the request carries it as `Accept-Language`, the way the import request does. The template's labels are written in the request's locale, and the import accepts a translated label only in its own request's locale, so the two requests must match.
- **`@object-ui/plugin-grid`: `ImportWizard` offers the template** when its data source has `downloadImportTemplate` and the user can create records of the object (`usePermissions().can(object, 'create')`, the server's own gate). A 405 (object not open for import), a 403 (no create permission) and any other failure each show a message on the upload step, and no file is saved. The client-built CSV is deleted, with its helpers (`buildImportTemplateCsv`, `exampleForField`, `firstOptionValue`, `downloadTextFile`). The column mapping step is unchanged.
- **`@object-ui/app-shell`**: the identity-import data source (`sys_user`) withholds `downloadImportTemplate`, because the server's template describes the generic import door, not the identity pipeline.
- **`@object-ui/i18n`**: `grid.import.downloadTemplateHint` describes the Excel template in all ten packs, and `grid.import.templateDownloadFailed` and `grid.import.templateNotPermitted` are new.
