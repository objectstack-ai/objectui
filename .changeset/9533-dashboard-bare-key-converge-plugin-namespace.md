---
'@object-ui/plugin-dashboard': minor
'@object-ui/cli': minor
---

Converge the bare `dashboard` key on `plugin-dashboard`, and retire
`view:dashboard` with a by-name tombstone (objectui#9533).

**Breaking for authored metadata.** `{ "type": "view:dashboard" }` no longer
renders a dashboard. It now resolves to a refusal that names the spelling and
names its replacement. `objectui validate` refuses the document at `type`
(`invalid_union`). `{ "type": "dashboard" }` and
`{ "type": "plugin-dashboard:dashboard" }` both render `DashboardRenderer`,
unchanged and newly-working respectively.

⚠️ **Dated note, 2026-09-25 — `objectui check` names the spelling only in a
file it recognises — objectui#10606.** This entry first said `objectui check`
reports `{ "type": "view:dashboard" }` as an unknown schema type, and **What
changed** below said, unscoped, that `check` names the spelling. `check` checks
the `type` of each file it recognises, and a file whose root carries an ObjectUI
structural key (`children`, `className`, `body`, …) is recognised by that key
alone. A file with none of those keys is parsed against the schema and
recognised only if it validates; one that does not validate is listed by name
when its root `type` is on the known-type list `check` reads, and is otherwise
counted as skipped. `view:dashboard` is withheld from that list, so the document
above is counted as skipped ("no ObjectUI recogniser admitted") and gets no
unknown-type line, while `{ "type": "view:dashboard", "className": "h-64" }` gets one.
`check` exits non-zero on unreadable JSON only; the verdict is
`objectui validate`'s.

**What was wrong.** `apps/console` declares the lazy stub for bare `dashboard`
under `plugin-dashboard` — twice, in `preview-gallery.tsx` and
`register-plugins.ts` — while this package registered the renderer as
`view:dashboard`. Neither site passed `skipFallback`, so both also claimed the
bare key (`Registry.register` and `Registry.registerLazy` share the
`meta?.namespace && !meta?.skipFallback` branch, and `registerLazy` has no
collision check at all, so nothing warned). Two consequences followed, and both
were reproduced against a real `Registry` before anything here was written:

1. **The bare key was double-claimed, phase-dependently.** After the stub step
   bare `dashboard` declared namespace `plugin-dashboard`; after the chunk
   loaded the same key declared `view`. Which answer a host got depended on when
   it asked — the objectui#6416 shape, which converged `plugin-report` off it.
2. **The namespaced stub was never cleared.** `register()` clears the lazy stub
   of the type IT registers, and that type was `view:dashboard`. So
   `hasLazy('dashboard', 'plugin-dashboard')` read `true` after the package had
   fully loaded and `get('dashboard', 'plugin-dashboard')` read `undefined`,
   while the generated CLI whitelist listed that spelling as renderable. A node
   authored with it could only ever paint `Loading plugin-dashboard:dashboard…`
   forever: `Registry.loadLazy` resolves whether or not the loaded module
   registered the expected type, and `SchemaRenderer` re-checks `hasLazy` on
   every pass. That is the objectui#8760 shape — a key that passes every
   authoring check and fails only in front of a user.

**What changed.** The renderer registers as `plugin-dashboard:dashboard`, the
namespace every sibling plugin, both console stubs and the CLI whitelist already
use, so the console stubs are cleared on load and all three claimants of the bare
key name ONE full type. The retired `view:dashboard` key answers
`RetiredDashboardNodeTombstone` — an inline refusal, plus a `console.error`
carrying the same text — registered with `skipFallback: true` so it claims no
bare key. Its spelling is withheld from the derived key universe by declaration
in `scripts/check-doc-component-types.mjs`, the same disposition the
`RETIRED_FIELD_TYPES` tombstones take, so `objectui check` names it in a file it
recognises rather than blessing it; `packages/cli/src/utils/known-schema-types.ts`
regenerates and loses that one entry.

**Also published: four new symbols on the package entry.** `src/index.tsx`
re-exports `RETIRED_DASHBOARD_NODE_TYPES`, `RetiredDashboardNodeTombstone`,
`reportRetiredDashboardNodeType` and `resetRetiredDashboardNodeTypeReports` from
`./retired-node-types`, and `exports["."]` is what publishes them — so these are
**published** surface, not an internal one, and removing or renaming one later is
a breaking change like any other export. They exist for the same reason
`@object-ui/fields` publishes its tombstone: the pin has to import the refusal
text it asserts rather than restate it.

**Also visible in the DOM: the `data-obj-type` value on a dashboard grid.** That
attribute carries the type the node was AUTHORED with, so the spelling that puts
a dashboard grid on the page moves with the registration.
`[data-obj-type="view:dashboard"]` no longer selects one — that node now renders
the tombstone, which publishes `data-retired-node-type` and no `data-obj-type` at
all — while `[data-obj-type="plugin-dashboard:dashboard"]` now does.
`{ "type": "dashboard" }` is unchanged and still reads `dashboard`. A stylesheet,
a selector or a DOM assertion keyed on the retired value stops matching, and
stops matching silently, so it is declared here rather than left to be found.

**Ruled, not chosen.** Director seat summon #24, batch #152 item 5 letter 1,
maintainer 「其他同意」 2026-09-18. The two rejected routes are on the record:
converging on `view` would leave the whitelist advertising a dead
`plugin-dashboard:dashboard`, and standing one side down resolves the naming
contest but not the unsatisfiable stub.

**`Clause-②: yes`**, declared by that ruling: the published full name moves. Note
the shape, because it is unusual — the accept set **narrows** (an authored
`view:dashboard` stops resolving) and the clause is `yes` anyway, on the
published-name move rather than on a widened surface. `minor` per AGENTS.md's
版本号策略: objectui's own breaking changes take `minor`, with the breaking
semantics written out here.

`packages/plugin-dashboard/src/__tests__/dashboardBareKeyOwnership.test.tsx` is
the half that outlives the fix. It reads the package's real declared metadata
back out of the registry and replays it into a fresh `Registry` in **both**
orders — eager-then-lazy and lazy-then-eager — checking the bare key's declared
namespace after every step, so order- and phase-independence are properties under
test rather than properties of the file it imports. It also asserts `hasLazy` is
false after the load, and asserts the `view:dashboard` refusal **together with**
the tombstone's own migration text, because a pin that asserts only "no dashboard
rendered" passes identically against a registration that was simply deleted —
the one outcome the ruling refuses. `objectui#9264`'s shrink-only bare-name
collision ledger loses its row: it is now empty.
