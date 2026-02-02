# ObjectStack Server Example

An ObjectStack server example that runs the metadata app using `@objectstack/cli`.

## Quick Start

```bash
# From the repo root
pnpm install

# Start the server with the ObjectStack CLI
pnpm --filter @object-ui/example-server serve
```

The server starts on http://localhost:3000 by default.

## What's Included

- `objectstack.config.ts` - Metadata app (objects, navigation, seed data)
- `src/objects` - Project and Task object definitions

## CLI Usage

You can also run the CLI directly from this folder:

```bash
objectstack serve objectstack.config.ts
```
