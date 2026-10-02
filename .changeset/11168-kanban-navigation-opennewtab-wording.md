---
'@object-ui/plugin-kanban': patch
---

The `object-kanban` `navigation` input description said `openNewTab: true` "outranks the mode". That does not hold for `none`: `useNavigationOverlay` checks `mode === 'none'` before `openNewTab`, so `{ mode: 'none', openNewTab: true }` opens nothing. The description in `src/index.tsx` now says `openNewTab` outranks every mode except `none` (objectui#11168 slice 5, from objectui#8652).

`src/__tests__/kanbanNavigationMembers-8652.test.tsx` pins both halves: `openNewTab` beside each overlay mode opens a new tab and no overlay, and beside `none` it opens nothing. Behaviour is unchanged.
