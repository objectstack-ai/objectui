---
'@object-ui/app-shell': patch
---

fix(app-shell): switching a report to `joined` clears the container binding it hides (objectui#10746)

Studio's report inspector committed `{ type: 'joined' }` alone when the type picker moved
to `joined`, and in the same render hid its dataset / values / rows / columns / chart
controls, while the spec's own `reportForm` hid the whole "Dataset binding" section
(`order` included) through `visibleWhen: "data.type != 'joined'"`. A report that was
bound first and switched second kept every one of those keys invisibly. `ReportSchema`'s
joined arm refuses a container `dataset` / `rows` / `columns` / `values` (objectstack PR
#20160: "a `joined` report selects per block — move `KEY` onto `blocks[]`, or delete it")
and has always refused a container `order`, so the save was refused at a path no control
on the Properties tab could reach; only the JSON source tab could delete the key.

The type picker now drops `dataset`, `values`, `rows`, `columns`, `chart` and `order`
in the same patch that commits `type: 'joined'` — an `undefined`-valued key, the same
spelling the inspector's own chart panel and its sibling inspectors already clear with,
which the host's shallow spread turns into an own key holding `undefined` and
`JSON.stringify` omits on the wire. Only keys the draft actually carries are named, so an
unbound report's switch stays the one-key patch it always was. `runtimeFilter` and
`drilldown` are kept: the joined branch reads both. Switching between two non-joined
types keeps the binding; switching away from `joined` restores nothing — the author
re-binds. `blocks` is never touched. The clear holds for the patch and for the save that
follows it. At this change the metadata-admin editor rebuilds its draft as the served draft
spread over `layered.effective` (on load, after each save and after publish), and
`effective` is the published layer, so a report whose PUBLISHED version was bound gets those
keys back in the draft after the first draft save until it is published, and a report already
saved `joined` with stale keys is not repaired on load. Both are the host's
draft-over-baseline merge, objectui#10765.

⚠️ **Dated note, 2026-09-27 — that merge has since been removed — objectui#10765.** Later in
this same release the metadata-admin editor takes a served draft as-is instead of spreading
it over the published layer, so the clear holds across the refresh after the save and through
publish. A report already saved `joined` with stale keys is still not repaired on load; the
author deletes them from the JSON tab. The rest of this entry is kept as the reading of this
change; the objectui#10765 entry states what the editors now do.
