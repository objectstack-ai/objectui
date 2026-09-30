---
'@object-ui/plugin-detail': minor
'@object-ui/i18n': minor
---

**BREAKING:** `@object-ui/plugin-detail` no longer exports seven components that
nothing registered and nothing mounted (objectui#7192, objectui#7175). This
narrows the package's published surface. It is declared `minor`, not `major`,
because this fixed release group follows the `@objectstack` major (AGENTS.md
§9); the breaking change is stated here instead.

Removed, with every type exported beside them:

- `CommentInput`, with `CommentInputProps`
- `DiffView`, with `DiffViewProps`, `DiffFieldType`, `DiffMode` and `DiffLine`
- `InlineCreateRelated`, with `InlineCreateRelatedProps`,
  `RelatedFieldDefinition` and `RelatedRecordOption`
- `MentionAutocomplete` and the helper `createMentionFromSuggestion`, with
  `MentionAutocompleteProps` and `MentionSuggestionItem`
- `PointInTimeRestore`, with `PointInTimeRestoreProps` and `RevisionEntry`
- `RecordNavigationEnhanced`, with `RecordNavigationEnhancedProps`
- `RelationshipGraph`, with `RelationshipGraphProps` and `GraphNode`

Why they went: none of the seven was passed to `ComponentRegistry.register`, so
metadata had no type string to name any of them, and none was mounted anywhere
in this repository. The downstream readings agree: `cloud` references none of
the seven names (objectstack#14187), and `hotcrm` depends on no `@object-ui/*`
package at all. The maintainer ruled to delete them; the ruling is relayed on
objectui#7192.

Not affected: `RichTextCommentInput` and its `MentionSuggestion` type (the
composer `RecordActivityTimeline` mounts), `RecordComments` (`DetailView`
mounts it) and `extractMentions` all stay exported.

`@object-ui/i18n`: the `detail.*` keys that only these components read are
removed from all ten locale packs, and the matching rows from
`DETAIL_DEFAULT_TRANSLATIONS`:

- `PointInTimeRestore`'s ten, added by objectui#7163: `revisionHistory`,
  `noRevisions`, `revisionFieldsChanged`, `revisionFieldsChangedOne`,
  `revisionPreview`, `revisionSnapshot`, `restoreConfirm`, `restoring`,
  `confirmRestore`, `restoreToPoint`
- `emptyValue`, an older key whose last reader was `PointInTimeRestore`
- `DiffView`'s five: `unifiedDiff`, `sideBySideDiff`, `noChanges`,
  `previousVersion`, `currentVersion`
- `RecordNavigationEnhanced`'s six: `firstRecord`, `previousRecordKey`,
  `nextRecordKey`, `lastRecord`, `searchWhileNavigating`, `searchRecords`

Keys these components shared with surfaces that stay (`detail.recordOf`,
`detail.noRecords`, `detail.cancel`, `detail.activityEmptyValue`, the
relative-time keys) are kept. A host that read one of the removed keys itself
now gets the raw key back.

Other entries in this same release describe work on `PointInTimeRestore` and
`DiffView` (their translation and display-locale fixes). That work shipped in
components this entry removes.

**Migration:** there is no replacement. If you import one of these components,
copy its source file (`packages/plugin-detail/src/`, the file named after the
component) from a release tag that still ships it, for example
`@object-ui/plugin-detail@17.5.0`, into your own code. If you need one of them
back in the package, open an issue that says who uses it and where.
