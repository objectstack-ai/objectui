---
'@object-ui/app-shell': patch
---

The package permission door now REFUSES the save when its save-time layered
re-read rejects, instead of silently deleting other packages' permission rows
(objectui#9420).

`PermissionMatrixEditPage.doSave` documents an ADR-0086 P0 guarantee for the
package door: merge only this package's slice back onto a fresh read of the
record, so rows contributed by other packages survive byte-for-byte. The fresh
read was `client.layered(...).catch(() => null)` and the merge base was
`fresh?.effective ?? payload`. On the rejecting arm the guarantee **inverted**:
`payload` is the editor's own draft, which the load path already sliced down to
this package's objects, so `mergePermissionSlice` had no out-of-scope rows left
to copy and the write PUT a record with every other package's permission rows
deleted — 200, no error, no warning, on a security surface.

A rejected re-read now raises on the page's existing error strip (the same
channel a failed `client.save` already uses) and nothing is written, so the
author can retry against a record that is still intact. A failed re-read means
the information needed to honour the guarantee is not in hand; a save that
proceeds anyway is the defect, not a degraded form of the fix.

**Not affected, deliberately.** Only a REJECTION refuses. A record the server
does not hold answers the 404 shape, which `MetadataClient.layered` resolves as
`{ effective: null, … }` — a set that exists only as a package draft has no
published rows for anyone to lose, so that arm keeps saving and the first save
of a newly created set is unchanged. The environment (whole-record) door never
took this path at all and is untouched.
