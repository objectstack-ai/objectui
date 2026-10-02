---
'@object-ui/plugin-timeline': minor
---

`object-timeline` and `view:timeline` publish the ten `@objectstack/spec` 17.5.0 row keys their renderer honours, and `objectName` is no longer required (objectui#11168 slice 5, under objectui#11111 decision 3 = B).

- Both registrations in `src/index.tsx` now share one list, `OBJECT_TIMELINE_INPUTS`, which adds `timeline`, `limit`, `data`, `items`, `dateFormat`, `rowLabel`, `minDate`, `maxDate`, `descriptionField` and `mapping`. The page validator (`validateTree` in `@object-ui/sdui-parser`) reported each as `unknown-prop` while `ObjectTimeline` read it. It now accepts them.
- `objectName` drops `required: true`. A timeline drawn from `items`, `data` or a `bind` path issues no query, and the validator raised `missing-required-prop`, an error, on such a timeline, though the spec row declares `objectName` optional. Entry-click navigation still reads it, and the `objectName` and `navigation` descriptions say so: on a timeline that names no `objectName`, `page` opens nothing and `new_window` / `openNewTab: true` open a tab at a slash and the entry's `id` alone, not the record page (`src/__tests__/timelineNavigationMembers-8654.test.tsx`).
- Two values the spec row refuses are now reported where they were not: a `dateFormat` outside `short` / `long` / `iso` is an `invalid-enum` error (it was an `unknown-prop` warning), and a `data` that is not an array is a `type-mismatch` warning (it drew nothing).
- Each new description says what the renderer does with the key, as measured through `SchemaRenderer` in `src/__tests__/objectTimelineInputs-11168.test.tsx`. Where the spec row's own describe is true of the renderer, the description starts with it word for word.
- The `sort` description no longer opens with "Entry order". `ObjectTimeline` draws entries composed from records by their start date, so the key orders the query, not the rail.
- The JSDoc on `ObjectTimelineProps`'s `navigation` member states the mechanism as measured: an absent key takes `useNavigationOverlay`'s no-config branch, which calls only an `onNavigate` the timeline never passes, so it never reaches the host's record navigator. A block written without `mode` takes the `page` branch instead.

No renderer code changes, so nothing changes at render time. The README and the docs page describe the record source order and each key.
