---
'@object-ui/plugin-dashboard': patch
---

fix(plugin-dashboard): the auto-refresh interval reads its handler through a ref, not a memoised identity

`useDashboardAutoRefresh`, the one timer behind `DashboardGridLayout` and
`DashboardRenderer`, armed its interval in an effect keyed on
`[seconds, onRefresh, handleRefresh]`, and `handleRefresh` is a `useCallback`
result. AGENTS.md #10 bans exactly that: React may throw a memo away and hand
back a new function while nothing it depends on changed, and every such
identity change cleared the interval and set it again, restarting its phase. A
host that passed a new `onRefresh` identity at the same period restarted it the
same way.

The interval is now keyed on the two values it reads, the period and whether a
handler is wired. The handler is read through a ref when a run happens, so the
run still calls the CURRENT `onRefresh`, and a new handler identity, from the
host or from a discarded memo, leaves the phase where it was. The manual
"Refresh All" button reads the same ref.

The existing timer pin keeps every case green, the equal-period phase case and
the handler-swap case among them, and adds one case per surface that forces a
memo discard mid-period and then swaps the host handler mid-period, asserting
both times that the run still lands on the original schedule.
