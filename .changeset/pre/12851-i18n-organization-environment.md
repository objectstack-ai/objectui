---
'@object-ui/i18n': patch
---

The console no longer calls two different things "workspace" (objectui#12851).

- **The organisation is "Organization"** in every pack (zh 组织, ja 組織, es Organización, de Organisation, fr organisation, ko 조직, pt organização, ru организация, ar مؤسسة): the `workspace.*` switcher and create-dialog strings and the `organizations.*` picker, such as "My Organizations", "Create organization", "Your Organizations".
- **The running instance is "Environment"** (zh 环境, ja 環境, es entorno, …) wherever a string is read inside one: the Setup subtitle and its settings category, the environment-timezone prompt and the cloud home's timezone line, the tenant sign-in hint, the "Build an app" refusal, the home loading and empty states, and the "System settings" quick action.
- **The cloud home's open button reads "Open"** (zh 打开), and the hint under it says in one line what an environment is: an independent instance that runs your apps, with its own URL, database and plan.
- The marketplace install refusal now asks you to contact your organization admin, in every pack.

Keys are unchanged; only values moved. "AI Workspace" (the assistant's full-page work area) keeps its name, because it names neither the organisation nor an environment.
