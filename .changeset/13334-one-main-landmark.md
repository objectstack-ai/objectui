---
"@object-ui/layout": patch
---

`AppShell` now draws one `main` landmark. `SidebarInset` already renders a `<main>`, and the content element inside it was a second `<main>`, so every console page (Setup record pages included) announced two main regions to screen readers. The content element is now a `<div>`; `className` still lands on it, and the skip link still targets the console's route slot.
