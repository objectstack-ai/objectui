---
'@object-ui/plugin-gantt': patch
---

`ObjectGantt` no longer re-issues its record query because React threw a memo cache
away (objectui#10036).

The fetch seam carried two dependencies that AGENTS.md §5 commandment #10 bans — the
ninth and tenth instances of the class ruled on objectui#8640. `reload`'s dependency
list named `effectiveDataSource`, a `useMemo` result, and the mount effect named
`reload`, a `useCallback` result. Both hooks are documented performance hints: React
may discard the cache and recompute even when the dependency list compares equal, and
the object that comes back is then a new one.

That is not harmless here. `resolveDataSource` returns the context adapter UNCHANGED
for `provider: 'object'`, but CONSTRUCTS a fresh `ApiDataSource` / `ValueDataSource`
for `provider: 'api'` and `provider: 'value'` — so on those two providers a discard
alone handed `reload` a brand-new adapter for a byte-identical authored config, rebuilt
`reload`, and re-fired the mount effect: one redundant round trip per discard, on a
view nobody had touched. A discarded `useCallback` moves `reload`'s identity whatever
its own dependency list says, so the second half had to move with the first.

The record fetch now READS the adapter through a ref and KEYS on the values that
determine it: the authored config slice `resolveDataSource` actually reads, per
provider arm, plus the host's `dataSource` and `apiFetch`. Every authored or host
change that used to refetch still refetches — a changed `api` endpoint, changed
`read`/`write` config, changed inline `items`, a swapped adapter, a swapped
authenticated fetch, a changed object, filter or sort. What no longer refetches is a
discard, and an inert key inside `data` that the resolved adapter never reads.

The file already recorded half of this in the first person: `dataItems` came off that
same dependency list because a discard «was enough to give `reload` a fresh identity
and re-fire the mount effect below (objectui#6592)». One banned identity came off the
line then; the other stayed on it until now.
