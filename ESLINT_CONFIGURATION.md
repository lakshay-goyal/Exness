# ESLint Configuration Summary

This document describes the strict ESLint configuration set up for the entire codebase.

## Overview

The ESLint configuration enforces:
1. **Consistent Function Structure** - Arrow functions preferred, consistent styling
2. **No Unused Variables/Functions** - Automatic detection and error reporting
3. **Strict Type Safety** - TypeScript strict mode with type-checked rules
4. **Code Organization** - Import/export patterns and naming conventions

## Configuration Structure

### Root Configuration (`eslint.config.js`)
- Extends the base configuration from `packages/eslint-config`
- Contains global ignores consolidated from all `.gitignore` files

### Base Configuration (`packages/eslint-config/base.js`)
Core rules for all TypeScript/JavaScript files:

#### Function Structure Rules
- `func-style`: Enforces arrow functions for consistency
- `arrow-body-style`: Concise bodies when possible
- `prefer-arrow-callback`: Arrow functions for callbacks
- `prefer-template`: Template literals over string concatenation
- `prefer-destructuring`: Destructuring for arrays and objects

#### Unused Detection Rules
- `@typescript-eslint/no-unused-vars`: Error on any unused variable/function
  - Allows `_` prefix for intentionally unused variables
  - Checks all arguments, caught errors, and rest siblings
- `@typescript-eslint/no-unused-expressions`: No unused expressions

#### Type Safety Rules
- `@typescript-eslint/no-explicit-any`: Bans `any` type
- `@typescript-eslint/no-unsafe-*`: Bans unsafe operations (assignment, member access, call, return, argument)
- `@typescript-eslint/no-floating-promises`: Promises must be handled
- `@typescript-eslint/no-misused-promises`: Correct promise usage
- `@typescript-eslint/await-thenable`: Only await thenable values
- `@typescript-eslint/require-await`: Async functions must use await
- `@typescript-eslint/no-non-null-assertion`: Bans `!` operator
- `@typescript-eslint/explicit-function-return-type`: Functions must have return types
- `@typescript-eslint/explicit-module-boundary-types`: Module boundaries must be typed

#### Strict Boolean & Type Checking
- `@typescript-eslint/strict-boolean-expressions`: Strict boolean checks
- `@typescript-eslint/switch-exhaustiveness-check`: All switch cases must be handled
- `@typescript-eslint/no-unnecessary-condition`: No unnecessary conditions

#### Naming Conventions
- Interfaces: PascalCase
- Type aliases: PascalCase
- Enums: PascalCase with UPPER_CASE members
- Functions: camelCase or PascalCase
- Variables: camelCase or UPPER_CASE (constants)
- Classes: PascalCase
- Properties/Methods: camelCase

### React Configuration (`packages/eslint-config/react-internal.js`)
Additional rules for React apps (mobile, web, docs, ui):

- `react/function-component-definition`: Arrow functions for components
- `react-hooks/rules-of-hooks`: Correct hook usage
- `react-hooks/exhaustive-deps`: Complete dependency arrays
- `react/no-unused-prop-types`: No unused prop types
- `react/no-unused-state`: No unused state
- `react/destructuring-assignment`: Always destructure props
- `react/self-closing-comp`: Self-closing tags when no children
- `react/jsx-no-useless-fragment`: No useless fragments

### Next.js Configuration (`packages/eslint-config/next.js`)
Extends React config with Next.js specific rules for web and docs apps.

## Ignored Files/Folders

### From All .gitignore Files (in ESLint config):
```
# Dependencies
node_modules/, .pnp/, .pnp.js

# Build outputs
dist/, .next/, build/, out/, .swc/, .turbo/, *.tsbuildinfo

# Mobile/Expo native exports (IMPORTANT - These are generated)
ios/, android/, board/, .expo/, web-build/, expo-env.d.ts
.kotlin/, .metro-health-check*

# Native mobile files
*.orig.*, *.jks, *.p8, *.p12, *.key, *.mobileprovision

# Generated files
.vercel/, *.pem, .env*, .env.*.local

# Logs
*.log*, npm-debug.log*, yarn-debug.log*, yarn-error.log*

# Coverage
coverage/, *.lcov

# Cache
.eslintcache, .cache/, .parcel-cache/

# IDE
.idea/, .vscode/, *.swp, *.swo, *~, .DS_Store, .cursor/

# Misc
app-example/, *.tgz, generated/prisma/, packages/snap-shotting/out/
```

## App/Package Specific ESLint Configs

| App/Package | Config Used | Notes |
|-------------|-------------|-------|
| `apps/web` | next-js | Next.js + React rules |
| `apps/docs` | next-js | Next.js + React rules |
| `apps/mobile` | react-internal | React Native + specific ignores for ios/android/board |
| `apps/Backend` | base | Node.js/Bun backend |
| `apps/Engine` | base | Node.js/Bun worker |
| `apps/Price_Poller` | base | Node.js/Bun worker |
| `apps/DBstorage` | base | Node.js/Bun worker |
| `apps/Batch_Upload` | base | Node.js/Bun worker |
| `apps/Websocket_Server` | base | Node.js/Bun worker |
| `packages/ui` | react-internal | React components library |
| `packages/types` | base | Type definitions |
| `packages/config` | base | Configuration package |
| `packages/trading-core` | base | Trading domain logic |
| `packages/api-client` | base | API client |
| `packages/utils` | base | Utilities |
| `packages/db` | base | Database client (ignores generated/prisma) |
| `packages/timescaledb` | base | TimescaleDB client |
| `packages/snap-shotting` | base | Snap-shotting (ignores out/, *.tgz) |

## Usage

### Run Linting
```bash
# Lint entire codebase
bun run lint

# Lint specific app/package
cd apps/web && bun run lint
cd packages/ui && bun run lint
```

### Type Checking
```bash
# Check types for entire codebase
bun run check-types
```

### Fix Auto-fixable Issues
```bash
# Many ESLint errors can be auto-fixed
eslint --fix .
```

## Common Patterns to Follow

### Function Style (ENFORCED)
```typescript
// ✅ CORRECT - Arrow function
const myFunction = (param: string): string => {
  return param.toUpperCase();
};

// ✅ CORRECT - Arrow function with implicit return
const myFunction = (param: string): string => param.toUpperCase();

// ❌ INCORRECT - Function declaration
function myFunction(param: string): string {
  return param.toUpperCase();
}
```

### Component Style (ENFORCED)
```typescript
// ✅ CORRECT - Arrow function component
const MyComponent = ({ title, children }: MyComponentProps): React.ReactElement => {
  return <div>{title}{children}</div>;
};

// ❌ INCORRECT - Function declaration
function MyComponent({ title }: MyComponentProps) {
  return <div>{title}</div>;
}
```

### Unused Variables (ENFORCED)
```typescript
// ✅ CORRECT - Use all variables
const result = calculateValue(input);
console.log(result);

// ✅ CORRECT - Prefix unused with underscore
const [_unused, used] = array;

// ❌ INCORRECT - Unused variable
const result = calculateValue(input);
// result never used - ESLint will error
```

### Return Types (ENFORCED)
```typescript
// ✅ CORRECT - Explicit return type
const calculate = (a: number, b: number): number => a + b;

// ❌ INCORRECT - Missing return type (inferred is not allowed)
const calculate = (a: number, b: number) => a + b;
```

### Type Safety (ENFORCED)
```typescript
// ❌ INCORRECT - any type
const data: any = fetchData();

// ✅ CORRECT - Proper typing
const data: UserData = fetchData();

// ❌ INCORRECT - Non-null assertion
const value = object.property!;

// ✅ CORRECT - Type guard or optional chaining
const value = object?.property ?? defaultValue;
```

### Promises (ENFORCED)
```typescript
// ❌ INCORRECT - Floating promise
fetchData();

// ✅ CORRECT - Handle promise
await fetchData();

// ✅ CORRECT - Explicit void if intentionally not awaited
void fetchData();
```

## Next Steps

1. **Install dependencies**: `bun install` (if you haven't already)
2. **Run lint check**: `bun run lint` to see all current issues
3. **Review errors**: The configuration is strict and will show many errors initially
4. **Fix incrementally**: Run `eslint --fix` for auto-fixable issues
5. **Manual fixes**: Address remaining errors one by one

## Important Notes

- The `board/` and `android/` folders are **explicitly ignored** in both ESLint and `.gitignore` since they are generated from mobile export
- All native iOS/Android export folders are ignored
- Unused variables with `_` prefix are allowed (convention for intentionally unused)
- Return types are **required** on all functions for type safety
- `any` type is completely banned
- Console logs are allowed but warned (use `warn`, `error`, `info` only)
