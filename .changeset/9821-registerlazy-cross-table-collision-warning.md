---
'@object-ui/core': patch
---

`Registry.registerLazy` now reports a bare-name collision, and `Registry.register`'s existing report is no longer blind to the other table.

Clause-②: no — this adds no exported symbol, no key on a published payload, and relaxes no accept set. Which registrations the registry ACCEPTS is unchanged, and so is what `skipFallback` does; only what the registry SAYS changes.

The registry has two doors onto one bare key: `register` writes `components`, `registerLazy` writes `lazyEntries`. `registerLazy` took the same `namespace && !skipFallback` fallback branch with no collision check at all, and `register`'s check read only its own table — so a contest that spans the two tables was reported by neither. Replaying this repository's own 425 declared registration claims against a real registry emitted zero collision warnings in every order, including for the one genuinely contested bare key.

Both doors now consult both tables and key on the declared full type, so a contest is reported whichever order the declarations arrive in. The ordinary stub-then-real lifecycle stays silent: a stub and the registration that satisfies it name one full type, and so do the bare keys this repository stubs twice from two files with different loader closures.

The two doors give different advice on purpose. `registerLazy` names `skipFallback: true`, which settles it there. `register` does not, because it clears the bare stub whether or not the fallback is taken, so that opt-out would leave the bare key resolving to nothing; it asks for the two declarations to agree on one full type instead.
