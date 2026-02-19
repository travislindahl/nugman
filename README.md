# nugman

[![CI](https://github.com/travislindahl/nugman/actions/workflows/ci.yml/badge.svg)](https://github.com/travislindahl/nugman/actions/workflows/ci.yml)

A terminal UI for managing .NET NuGet package sources, caches, and a local package feed. Replace memorizing `dotnet nuget` CLI commands with an interactive, keyboard-driven interface.

## Features

- **Source Management** - View, add, edit, delete, and toggle NuGet package sources
- **Cache Management** - Inspect cache locations, view disk usage, and clear caches
- **Local Package Feed** - Automatically maintained local NuGet source for development workflows
- **Package Management** - Add `.nupkg` files or build projects with `dotnet pack` into your local feed
- **Package Search** - Search packages across all configured sources with metadata inspection
- **Config Viewer** - Browse the NuGet configuration file hierarchy and see setting overrides

## Prerequisites

- [.NET SDK](https://dotnet.microsoft.com/) >= 6.0
- [Node.js](https://nodejs.org/) >= 22 (only needed for npm install or development)

## Install

### Standalone binary (recommended)

Download the latest binary for your platform:

```sh
curl -fsSL https://raw.githubusercontent.com/travislindahl/nugman/main/install.sh | bash
```

### npm

```sh
npm install -g nugman
```

### From source

```sh
git clone https://github.com/travislindahl/nugman.git
cd nugman
npm install
npm run build
npm link
```

## Usage

Launch `nugman` and navigate with the keyboard:

| Key          | Action                |
| ------------ | --------------------- |
| `Up` / `k`   | Move up               |
| `Down` / `j` | Move down             |
| `Enter`      | Select                |
| `Escape`     | Go back               |
| `a`          | Add                   |
| `e`          | Edit                  |
| `d`          | Delete                |
| `t`          | Toggle enable/disable |
| `c`          | Clear cache           |
| `/`          | Search                |
| `h`          | Health check          |
| `q`          | Quit                  |

## Local Package Feed

On first launch, nugman creates a local NuGet source directory in your OS config folder:

| OS      | Path                                                |
| ------- | --------------------------------------------------- |
| Windows | `%APPDATA%\nugman\local-source`                     |
| macOS   | `~/Library/Application Support/nugman/local-source` |
| Linux   | `~/.config/nugman/local-source`                     |

This source is automatically registered with NuGet and protected from accidental deletion.

## Development

```sh
npm run dev          # Run with tsx (no build step)
npm run build        # Compile TypeScript
npm run typecheck    # Type-check without emitting
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # ESLint + Prettier
```

## Project Structure

```
src/
  cli.tsx              # Entry point
  app.tsx              # Root component with view routing
  types.ts             # Shared types
  state/               # React Context + reducer for app state
  services/            # Business logic (dotnet CLI, sources, cache, packages)
  components/          # Ink/React UI components
  hooks/               # Custom hooks (navigation, async, dotnet detection)
  lib/                 # Utilities (platform detection, formatting, theming)
tests/
  unit/                # Service and utility tests
  component/           # UI component tests
```

## Built With

- [Ink](https://github.com/vadimdemedes/ink) + [React](https://react.dev/) - Terminal UI rendering
- [TypeScript](https://www.typescriptlang.org/) - Strict mode, ESM-only
- [Vitest](https://vitest.dev/) - Testing
- [fast-xml-parser](https://github.com/NaturalIntelligence/fast-xml-parser) - NuSpec parsing
- [adm-zip](https://github.com/cthackers/adm-zip) - `.nupkg` extraction

## License

ISC
