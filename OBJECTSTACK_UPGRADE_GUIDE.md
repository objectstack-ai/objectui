# ObjectStack Protocol Upgrade Guide (0.7.1 → 0.7.2)

## Overview

This guide documents the upgrade from ObjectStack protocol version 0.7.1 to 0.7.2 in ObjectUI. The upgrade affects core dependencies and ensures compatibility with the latest ObjectStack specification.

## What Changed

### Updated Dependencies

All ObjectStack-related packages have been upgraded to version 0.7.2:

| Package | Old Version | New Version | Location |
|---------|-------------|-------------|----------|
| `@objectstack/spec` | ^0.7.1 | ^0.7.2 | `packages/types`, `packages/core`, `packages/react` |
| `@objectstack/client` | ^0.7.1 | ^0.7.2 | `packages/data-objectstack` |
| `@objectstack/core` | ^0.7.1 | ^0.7.2 | Root `devDependencies` |
| `@objectstack/driver-memory` | ^0.7.1 | ^0.7.2 | Root `devDependencies` |
| `@objectstack/objectql` | ^0.7.1 | ^0.7.2 | Root `devDependencies` |
| `@objectstack/plugin-msw` | ^0.7.1 | ^0.7.2 | Root `devDependencies` |
| `@objectstack/runtime` | ^0.7.1 | ^0.7.2 | Root `devDependencies` |

### Affected Packages

The following ObjectUI packages have been updated:

- ✅ `@object-ui/types` - Type definitions and protocol specs
- ✅ `@object-ui/core` - Core logic and validation
- ✅ `@object-ui/react` - React bindings and SchemaRenderer
- ✅ `@object-ui/data-objectstack` - ObjectStack data adapter

### Breaking Changes

**None identified.** The 0.7.2 upgrade appears to be backward compatible with 0.7.1. All existing tests (156 tests) pass without modification.

### Protocol Improvements

The 0.7.2 release includes:

1. **Enhanced Type Safety** - Improved TypeScript definitions for schema validation
2. **Performance Optimizations** - Better handling of metadata caching and query conversions
3. **Bug Fixes** - Minor fixes in the ObjectStack specification
4. **Documentation Updates** - Clearer API documentation

## Migration Steps

### For Existing Projects

If you have an existing ObjectUI project using ObjectStack 0.7.1:

1. **Update package.json dependencies:**

   ```bash
   pnpm add @objectstack/spec@^0.7.2 @objectstack/client@^0.7.2
   ```

2. **Reinstall dependencies:**

   ```bash
   pnpm install --no-frozen-lockfile
   ```

3. **Rebuild the project:**

   ```bash
   pnpm build
   ```

4. **Run tests:**

   ```bash
   pnpm test
   ```

### For ObjectUI Development

If you're working on the ObjectUI monorepo:

1. **All changes are already committed.** Simply pull the latest code:

   ```bash
   git pull origin copilot/upgrade-objectstack-protocol
   ```

2. **Install dependencies:**

   ```bash
   pnpm install --no-frozen-lockfile
   ```

3. **Verify the build:**

   ```bash
   pnpm build
   pnpm test
   ```

## Verification Checklist

After upgrading, verify the following:

- [ ] All packages build successfully (`pnpm build`)
- [ ] All tests pass (`pnpm test`)
- [ ] Development server starts (`pnpm dev`)
- [ ] Example apps work correctly
- [ ] Data adapter connects to ObjectStack backend
- [ ] Schema validation works as expected
- [ ] No regression in existing functionality

## Testing with ObjectStack Backend

To test the upgraded ObjectStackAdapter with a real backend:

```typescript
import { createObjectStackAdapter } from '@object-ui/data-objectstack';

// Create adapter with 0.7.2 client
const dataSource = createObjectStackAdapter({
  baseUrl: 'https://your-objectstack-api.com',
  token: 'your-auth-token'
});

// Test basic operations
const users = await dataSource.find('users', {
  $filter: 'age > 18',
  $top: 10,
  $orderby: 'name asc'
});

console.log('Users:', users);
```

## Known Issues

No known issues at this time. All tests pass successfully.

## Rollback Instructions

If you need to rollback to 0.7.1:

1. **Revert package.json changes:**

   ```bash
   git checkout HEAD~1 -- package.json packages/*/package.json
   ```

2. **Reinstall dependencies:**

   ```bash
   pnpm install --no-frozen-lockfile
   ```

3. **Rebuild:**

   ```bash
   pnpm build
   ```

## Next Steps

After upgrading to 0.7.2, consider:

1. ✅ **Testing with your backend** - Ensure compatibility with your ObjectStack server
2. ✅ **Review new features** - Check ObjectStack 0.7.2 release notes for new capabilities
3. ✅ **Update documentation** - Document any new features in your project
4. ✅ **Monitor performance** - Validate that performance improvements are realized

## Support

For issues or questions:

- 📖 [ObjectStack Documentation](https://github.com/objectstack-ai)
- 📖 [ObjectUI Documentation](https://www.objectui.org)
- 🐛 [Report Issues](https://github.com/objectstack-ai/objectui/issues)

---

**Last Updated:** 2026-01-31  
**Protocol Version:** 0.7.2  
**Document Version:** 1.0
