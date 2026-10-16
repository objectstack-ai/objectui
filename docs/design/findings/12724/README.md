# objectui#12724 evidence — screenshots (evidence branch, never merged)

Rendered from feature-branch commit 781fc10 at 1280 px, light, zh-CN and en.

How: a temporary dev-server page in `apps/console` (not committed) mounted the
REAL `ChatbotEnhanced` under the real `I18nProvider`, with the envelopes lifted
by the REAL `mapMessages` readers (`detectProposedPlan`, `detectDraftResult`,
`buildProgressFromDraftReview`). Faked inputs only: spec-shaped fixture
envelopes (`SolutionBlueprintSchema` keys), a publish-count probe answering 0,
the live build-progress part's app label, and the clock (advanced 48 s for the
design turn, 64 s for the build turn while they streamed, so the measured time
shows). No live build agent was reachable from the container.

| File | Shows |
| --- | --- |
| `*-plan-card.png` | the plan card: app name in the header, 等待确认, field chips, view rows, assumptions, the two buttons and the reply hint |
| `*-progress-collapsed.png` / `*-progress-expanded.png` | the design phase's one line, then expanded by its chevron |
| `*-result-card.png` | the finished build card: 已搭建并上线, 打开应用 / 在 Studio 中查看, next steps and the posture sentence |
| `*-design-turn-1280.png` / `*-build-turn-1280.png` | the whole conversation at 1280 px, with the composer placeholder and key hint |
