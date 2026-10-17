---
'@object-ui/app-shell': patch
'@object-ui/components': patch
---

Studio's "Add region" writes only a region name the page's template places, and a page that names no template refuses an unplaced region on screen (objectui#12902).

`@objectstack/spec` 18 judges a `kind: 'full'` page's regions under its `template`, or under `default` when it names none (`checkPageRegionPlacement`, `PAGE_TEMPLATE_SLOTS`), and refuses at `os validate` and at the save door a region that template does not place.

- **Studio page designer.** "Add region" used to append `region_N` whatever the template, so on every template but `dashboard` the draft it wrote was refused at save (422 `INVALID_METADATA`). It now opens a menu of the template's slots that no region fills yet, read from the spec's `PAGE_TEMPLATE_SLOTS`; on `dashboard` it also offers a fresh grid cell name. When every slot is filled, or the page names a template the spec does not declare, the control is disabled and says why beside it.
- **Page renderer.** A `kind: 'full'` page that names no template (the `pageType` layouts) is judged as `default`, as the spec judges it: a region `default` does not place is no longer stacked under `main` but drawn nowhere, and the page shows the same refusal a `template: 'default'` page shows (`data-page-refusal="unplaced-region"`). Regions named for a `default` slot (`header`, `sidebar`, `main`, `aside`, `footer`) render as before. A page of another kind, which the spec's placement check does not judge, keeps the stacking.

Nothing is added to either package entry. The new copy lives in the metadata-admin designer's own string tables (en and zh).
