---
'@object-ui/cli': patch
---

The `objectui doctor` check-result types are declared as `DoctorDiagnostic` and `DoctorDiagnosticLevel` instead of `Diagnostic` and `DiagnosticLevel` (objectui#6349, batch 6), because `@object-ui/sdui-parser` publishes `Diagnostic` for a parser finding, a different shape. Both types are internal to the command: this package's entry exports `serve` and `init` only, so no import changes.

No runtime behaviour changes; `objectui doctor` prints the same output.
