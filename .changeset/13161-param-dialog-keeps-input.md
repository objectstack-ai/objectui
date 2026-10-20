---
'@object-ui/core': minor
'@object-ui/app-shell': patch
---

An action's param dialog keeps what the user typed when the server refuses the run (objectui#13161).

The console's param dialog resolved its values and closed on Confirm, before the action ran, so a refusal ("User already exists. Use another email.", an invalid redirect URL) landed on a dialog that no longer existed: only the error toast remained, and the user typed everything again. The dialog now stays open and busy until the run settles. A success closes it, and the runner toasts as before. A refusal leaves it open with every value as typed and the refusal shown above the buttons, so the user can fix the input and confirm again, or cancel. While the run is in flight, Confirm and Cancel are disabled and the dialog does not close. Cancel after a refusal closes the dialog and runs nothing more.

The refusal is shown as the form's, never on a field: the run's result carries it as text only, and the dialog does not guess a field from the sentence. The runner still toasts it.

The runner hands the param-collection handler a `run` function: called with the collected values, it dispatches the action and resolves with that run's result. A refused run gets its post-execution (error toast, `onFailure`) at once; a successful run's post-execution waits until the handler settles, so the dialog is closed before the success toast or a result dialog shows. A call made while a run is in flight returns that run and dispatches nothing new. A handler that never calls `run` keeps the old contract: one dispatch with the values it resolves. The console's two param handlers, `useConsoleActionRuntime`'s and `RecordDetailView`'s, forward it to `ActionParamDialog`. The type-level actions of a metadata type (`MetadataTypeActions`) run without the runner and keep the old close-on-Confirm behavior.

**Clause-②: yes (widening).** The exported `ParamCollectionHandler` type in `@object-ui/core` gains an optional fourth parameter, `run?: (values: Record<string, any>) => Promise<ActionResult>`. A handler that ignores it reads exactly as before. `ActionParamDialog`'s state type gains one optional member, `run`; that type is not in `@object-ui/app-shell`'s barrel.
