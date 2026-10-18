---
'@object-ui/app-shell': patch
---

Studio's permission-set editor no longer offers the two delegated-admin switches that `@objectstack/spec` 18 retired (objectui#12406, the objectui half of objectstack#23488).

`adminScope.manageBindings` and `adminScope.authorEnvironmentSets` are now retired tombstones in the spec: the protocol refuses either key whatever it holds, `false` included, because no door ever honoured them. The Delegated Admin Scope facet drew a "Manage bindings" and an "Author env sets" switch that wrote them, so once a business unit was named, flipping either one made the whole permission set unsaveable. Both switches are gone, with their English and Chinese captions, and the facet's help text no longer offers to "manage bindings". "Manage assignments", "Include subtree", the business unit and the assignable permission sets are unchanged.

A permission set stored with either key is cleaned by the server, not by this editor: the server reads stored and draft rows through the spec's stored-row conversion, which drops both keys before the body reaches Studio, and a re-save then stores the clean shape.

**Clause-②: no.** Nothing on `@object-ui/app-shell`'s published entry changes: the facet component and the metadata-admin dictionary are internal to the package. The change removes two controls that wrote keys the spec already refuses, so no accepted input narrows and nothing widens.
