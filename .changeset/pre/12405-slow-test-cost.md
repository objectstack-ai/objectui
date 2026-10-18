---
---

No package released: tests only. `export-to-react-compiles.test.ts` runs its two real-prop TypeScript compiles once at module scope and parses on-disk files once per options set, and `check-object-metadata-write-doors.test.ts` walks the repository once at module scope, so neither file's tests carry a whole-program or whole-repo cost inside the 15 s `testTimeout` (objectui#12405).
