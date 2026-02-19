# Quickstart: NuGet TUI Manager

**Feature Branch**: `001-nuget-tui-manager`
**Date**: 2026-02-18

## Prerequisites

- Node.js >= 20
- npm (ships with Node.js)
- .NET SDK >= 6.0 (provides `dotnet` CLI)

## Project Setup

```bash
# Initialize the project
npm init -y

# Install core dependencies
npm install ink@6.8.0 react@19 @inkjs/ui@2.0.0 adm-zip fast-xml-parser

# Install dev dependencies
npm install -D typescript@5.9 @types/react@19 @types/node \
  tsx vitest ink-testing-library@4 @types/adm-zip
```

## Configuration Files

### package.json additions

```jsonc
{
  "type": "module",
  "bin": {
    "nugman": "./dist/cli.js"
  },
  "scripts": {
    "dev": "tsx src/cli.tsx",
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2023",
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "jsx": "react-jsx",
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### vitest.config.ts

```typescript
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
```

## Project Structure

```
nugman/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── cli.tsx                    # Entry point: render(<App />)
│   ├── app.tsx                    # Root App component with navigation
│   ├── state/
│   │   ├── app-context.tsx        # React Context + reducer for global state
│   │   └── app-reducer.ts         # State reducer and action types
│   ├── services/
│   │   ├── dotnet-cli.ts          # Low-level dotnet CLI wrapper
│   │   ├── nuget-source.ts        # Source management service
│   │   ├── nuget-cache.ts         # Cache management service
│   │   ├── local-source.ts        # Local source management service
│   │   ├── package-metadata.ts    # .nupkg metadata reader
│   │   ├── package-search.ts      # Package search service
│   │   ├── nuget-config.ts        # Config file reader/analyzer
│   │   └── app-config.ts          # App configuration (paths, settings)
│   ├── components/
│   │   ├── shared/
│   │   │   ├── status-bar.tsx     # Bottom bar with keyboard shortcuts
│   │   │   ├── error-display.tsx  # Consistent error display
│   │   │   ├── loading.tsx        # Loading spinner wrapper
│   │   │   ├── confirm-dialog.tsx # Confirmation prompt wrapper
│   │   │   ├── empty-state.tsx    # Empty state message
│   │   │   └── list-view.tsx      # Reusable navigable list
│   │   ├── main-menu.tsx          # Main menu / dashboard
│   │   ├── sources/
│   │   │   ├── source-list.tsx    # Source list view
│   │   │   ├── source-edit.tsx    # Edit source form
│   │   │   └── source-add.tsx     # Add source form
│   │   ├── cache/
│   │   │   ├── cache-list.tsx     # Cache locations view
│   │   │   └── cache-browse.tsx   # Browse cache contents
│   │   ├── local-source/
│   │   │   ├── package-list.tsx   # Local packages view
│   │   │   └── add-package.tsx    # Add package (file or build)
│   │   ├── search/
│   │   │   ├── search-view.tsx    # Search input + results
│   │   │   └── search-detail.tsx  # Package detail from search
│   │   ├── config/
│   │   │   ├── config-list.tsx    # Config file hierarchy
│   │   │   └── config-detail.tsx  # Config file contents
│   │   └── package-detail.tsx     # Shared package metadata view
│   ├── hooks/
│   │   ├── use-navigation.ts      # Navigation hook (push/pop views)
│   │   ├── use-async.ts           # Async operation hook with loading/error
│   │   └── use-dotnet.ts          # dotnet CLI availability hook
│   └── lib/
│       ├── platform.ts            # OS detection, config paths
│       ├── format.ts              # Formatting utilities (bytes, etc.)
│       └── parse-cli-output.ts    # dotnet CLI output parsers
└── tests/
    ├── unit/
    │   ├── services/
    │   │   ├── dotnet-cli.test.ts
    │   │   ├── nuget-source.test.ts
    │   │   ├── nuget-cache.test.ts
    │   │   ├── local-source.test.ts
    │   │   ├── package-metadata.test.ts
    │   │   └── parse-cli-output.test.ts
    │   └── lib/
    │       ├── platform.test.ts
    │       └── format.test.ts
    ├── integration/
    │   ├── source-management.test.tsx
    │   ├── cache-management.test.tsx
    │   └── local-source.test.tsx
    └── component/
        ├── main-menu.test.tsx
        ├── source-list.test.tsx
        ├── cache-list.test.tsx
        └── package-list.test.tsx
```

## Minimal Working Example

### src/cli.tsx

```tsx
import React from "react";
import { render } from "ink";
import { App } from "./app.js";

render(<App />);
```

### src/app.tsx

```tsx
import React from "react";
import { Box, Text } from "ink";

export function App(): React.ReactNode {
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">nugman - NuGet TUI Manager</Text>
      <Text dimColor>Loading...</Text>
    </Box>
  );
}
```

### Running

```bash
# Development
npm run dev

# Type check
npm run typecheck

# Run tests
npm test
```
