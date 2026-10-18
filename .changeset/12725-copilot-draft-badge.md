---
'@object-ui/app-shell': minor
---

Studio's 变更 badge and the item header follow the copilot's drafts as they land (objectui#12725, item 5).

- **The badge counts a copilot draft the moment the tool answers.** The copilot's chat host (`ChatPane`) announces each tool result that carries an authoring envelope (a `drafted` result, or a 确认修改 replay's verdict) on the assistant bus as soon as it arrives in the stream. Before, it waited for the whole turn to finish, so the badge kept the old count for as long as the agent went on writing after the tool had answered. Each result is announced once; a result already in the thread when the chat opens is history and is not announced again. No reload and no navigation is involved: the badge's ledger (`_drafts`) re-reads on the pulse, as it already did.
- **The item header shows 「草稿 · N 项未发布」** (en: "Draft · N unpublished") on the Interfaces, Data and Automations pillars while the open item is a pending draft, in place of the "Unpublished draft" chip. It reads the ledger the badge counts, so a draft the copilot writes to the open item shows as it lands, and the line goes when a publish or a discard takes the item off the ledger. N is the badge's number: publishing is package-level, so the line says this item is one of N unpublished changes, and its tooltip says so. Where the ledger could not be read, the header keeps the "Unpublished draft" chip, with no count.

Clause-②: no. No spec key, export, prop or language-pack key changes; the new copy is two rows of the Studio designer table (en and zh).
