---
'@object-ui/app-shell': patch
'@object-ui/plugin-detail': minor
'@object-ui/react': minor
'@object-ui/i18n': patch
---

fix(app-shell,plugin-detail): the record feed says "no permission" when its read is refused, instead of showing an empty list

This widens two published surfaces: `@object-ui/plugin-detail` gains the export `isRefusedFeedRead`, and `@object-ui/react`'s `DiscussionContextValue` gains the optional members `activityDenied` and `commentsDenied` (as do `RecordActivityTimelineProps` and `RecordChatterPanelProps`).

When the server refused a record's activity read (401, 403, or a permission
envelope), the record page's discussion panel and the `record:activity` block
rendered the empty state: "No comments yet" or "No activity recorded". A member
who was not allowed to see the activity could not tell that apart from a record
with no history. Every failed feed read ended in a catch that treated it as an
empty answer.

Each feed read now keeps its verdict. A refused read shows a localized
no-permission state in place of the empty state: a lock and "You don't have
permission to view activity on this record." When the other read did answer, its
rows stay on screen and the notice above them names the half that was withheld.
A refused `sys_comment` read shows "You don't have permission to view comments on
this record." in the same way.

- **What counts as refused** is one verdict, `isRefusedFeedRead`, exported from
  `@object-ui/plugin-detail`. Both surfaces use it. It is the `forbidden` and
  `unauthorized` kinds of the existing `classifyLoadError` read classifier, and
  it reads no status of its own.
- **Unchanged:** a read that answers with zero rows, a 404 (`sys_activity` on a
  deployment without the audit plugin), and any other failure such as a 500 keep
  the empty state. The panel has no error state of its own.
- **Not retried:** a refusal is recorded and shown; the read is not re-issued.
- `DiscussionContext` (`@object-ui/react`) gains two optional members,
  `activityDenied` and `commentsDenied`, which the host that owns the fetch
  sets. `RecordActivityTimeline` and `RecordChatterPanel` take the same two
  optional props.
- Two new `detail.*` strings, `activityAccessDenied` and `commentsAccessDenied`,
  are translated in all ten locale packs.
