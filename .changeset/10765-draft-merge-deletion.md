---
'@object-ui/app-shell': patch
---

fix(app-shell): the metadata editors take a served draft as-is instead of spreading it over the published layer (objectui#10765)

The metadata-admin editor (`ResourceEditPage`) rebuilt its draft as the served draft spread
over `layered.effective` — on load, after every draft save and after publish — and the Studio
design surface did the same when it opened an app, a surface, an object or a flow, as did the
package OWD overview when it read and re-saved an object's draft. `effective` is the PUBLISHED
layer, and a spread cannot express deletion: a key the author cleared in the draft (the report
inspector's joined clear of `dataset` / `values` / `rows` / `columns` / `chart` / `order`, an OWD
model set back to unset, any key deleted from the JSON tab) was absent from the first draft PUT,
came back into the editor from the published layer on the refresh after that save, invisibly,
and the next save or publish sent it again.

The spread existed for a partial draft overlay that never reaches these editors: the server
(`metadata-protocol`) stores a `?mode=draft` body raw and its `?state=draft` read returns that
row raw, and every draft writer sends a whole document. So each site now takes the served draft
as-is when there is one and falls back to `effective` (then `code`) only when no draft exists;
the inherited `type` the spread was protecting is already inside the draft. `config.toDraft`
still normalises whatever is taken, now on the post-publish refresh as well. This removes the
reach limit the objectui#10746 entry states — a bound published report getting its cleared
keys back after the first draft save; a report already saved `joined` with stale keys is still
not repaired on load, and the author deletes them from the JSON tab.
