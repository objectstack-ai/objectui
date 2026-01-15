# Changesets

This directory contains changeset files that track changes to packages in the Object UI monorepo.

## What are Changesets?

Changesets are a way to declare your intent to release packages. They help us:
- Track which packages have changed
- Determine appropriate version bumps (major, minor, patch)
- Generate comprehensive changelogs
- Automate the release process

## Quick Start

### Creating a Changeset

When you make changes to packages, run:

```bash
pnpm changeset
```

This will guide you through:
1. Selecting which packages changed
2. Choosing the type of version bump
3. Writing a description of the changes

### Example

```bash
$ pnpm changeset

🦋  Which packages would you like to include?
◉ @object-ui/react
◯ @object-ui/core
◯ @object-ui/components

🦋  What kind of change is this for @object-ui/react?
◯ major (breaking change)
◉ minor (new feature)
◯ patch (bug fix)

🦋  Please enter a summary for this change:
Add support for custom validators in form components
```

### When to Create a Changeset

✅ **DO** create a changeset for:
- New features
- Bug fixes
- Breaking changes
- Performance improvements
- API changes

❌ **DON'T** create a changeset for:
- Documentation updates
- Changes to examples or apps
- Internal refactoring with no API changes
- Test-only updates

## Automated Release Process

1. **Merge PR with changeset** → Triggers automation
2. **Bot creates "Version Packages" PR** → Updates versions and changelogs
3. **Merge Version PR** → Automatically publishes to npm

## Learn More

- [Full Changesets Documentation](https://github.com/changesets/changesets)
- [Object UI Contributing Guide](../CONTRIBUTING.md#versioning-and-releases)
- [Common Questions](https://github.com/changesets/changesets/blob/main/docs/common-questions.md)

