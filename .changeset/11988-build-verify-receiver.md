---
'@object-ui/plugin-chatbot': minor
'@object-ui/i18n': minor
---

The chat build panel reads cloud's post-apply verification loop, and an unknown build phase no longer reads as "Building" (objectui#11988, the receiver objectstack-ai/cloud#2172's ruling A orders).

After `apply_blueprint` finishes, cloud's agent loop reports its verification hops on a second `data-build-progress` part with the id `build-verify`, beside the build tree. A hop is `{ phase: 'verify', hop, tool }` and the exit is `{ phase: 'done' }`. The receiver used to take the last `data-build-progress` part whatever its id, and turned every phase other than `data` and `done` into `structure`. So the first verification hop replaced the finished tree with "Building your app…".

- **The tree and the verification part are read apart, by part id.** The `build-verify` part never displaces the tree, whichever order the two parts arrive in. A message that carries only the tree maps and renders exactly as before.
- **The build panel shows a verification line under the tree.** It reads "Checking the change… step N" while a hop runs, with the hop's tool name as its tooltip, and "Checked the change" once the `done` frame arrives. A `build-verify` part on a message that has no build tree is not drawn as a tree.
- **Phases are read against the spec's vocabulary.** The receiver reads `BUILD_PROGRESS_PHASES` and `BUILD_PROGRESS_FRAME_TYPE` from `@objectstack/spec/ai` instead of restating them. A phase outside that vocabulary, or a frame without one, is now `unknown` and shows as a warning line ("Unknown build phase") on the tree header or on the verification line. It is no longer coerced to `structure`.
- **Type change.** `ChatBuildProgress.phase`, reached through `ChatMessage['buildProgress']`, widens from `'structure' | 'data' | 'done'` to the spec's `BuildProgressPhase` plus `'unknown'`, and `ChatBuildProgress` gains an optional `verify` member: `{ phase, hop?, tool? }`.
- **New language-pack keys, in all ten packs:** `chatbot.build.verifying`, `chatbot.build.verifyStep`, `chatbot.build.verified` and `chatbot.build.unknownPhase`.
