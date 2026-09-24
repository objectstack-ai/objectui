---
'@object-ui/types': minor
'@object-ui/components': minor
---

**BREAKING: the unimplemented async export-job path is removed from `@object-ui/types` and `@object-ui/components`**

What left:

- `@object-ui/components`: the `useExportJob` hook with its `UseExportJobOptions`
  and `UseExportJobReturn` types, and the `ExportProgressDialog` component with
  its `ExportProgressDialogProps` type.
- `@object-ui/types` (the root entry and the `./data` subpath): the optional
  `DataSource` members `createExportJob`, `getExportJobProgress`,
  `cancelExportJob` and `getExportJobDownloadUrl`, and the types
  `ExportJobStatus`, `ExportJobFormat`, `CreateExportJobRequest`,
  `CreateExportJobResult` and `ExportJobProgressInfo`. None of them had a zod
  mirror.

Why: ruling letter A on objectstack#17158 retires the export-job API contract
family from `@objectstack/spec`, because no server serves it and
`IExportService` has no provider. The same ruling has objectui retire its
consumer side first, and retire it rather than keep it alive with local copies
of the spec's types (objectui#10247).

No `DataSource` in this repository implemented any of the four methods. That
was measured at `d7de5348` over every class that implements `DataSource` and
every test double typed as one under `packages/`, `apps/` and `examples/`, with
the synchronous `exportDownload` member as the control that did match. So
`useExportJob` could only ever report `isSupported: false` here, and no runtime
behaviour in this repository changes.

⚠️ Implementers and importers outside this repository are NOT MEASURED. Code
that imports any name above no longer compiles, and a host `DataSource` that
implements the four methods is no longer called by anything in objectui. There
is no replacement API: the protocol no longer declares an async export job.

The synchronous export path is unchanged: `DataSource.exportDownload` and its
`ExportDownloadRequest` (csv / json / xlsx), and the grid's client-side
fallback.

Marked `minor`, not `major`, per the version-alignment convention in AGENTS.md;
the break is real and is stated here.
