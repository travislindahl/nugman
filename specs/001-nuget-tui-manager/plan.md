# Implementation Plan: NuGet TUI Manager

**Branch**: `001-nuget-tui-manager` | **Date**: 2026-02-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-nuget-tui-manager/spec.md`

## Summary

Build a cross-platform Terminal UI application ("nugman") that provides visual, keyboard-driven management of .NET NuGet configurations, caches, sources, and a managed local NuGet feed. The application uses React Ink 6.8.0 for the TUI framework with TypeScript in strict mode, wrapping `dotnet` CLI commands for NuGet operations and using `adm-zip`/`fast-xml-parser` for .nupkg metadata inspection.

## Technical Context

**Language/Version**: TypeScript 5.9.x (strict mode enabled, ESM-only)
**Runtime**: Node.js >= 20
**Primary Dependencies**: Ink 6.8.0, React 19, @inkjs/ui 2.0.0, adm-zip 3.2.x, fast-xml-parser 5.3.x
**Storage**: Filesystem only — OS-specific config directory, .nupkg files, dotnet CLI config files
**Testing**: Vitest 4.x + ink-testing-library 4.0.0
**Target Platform**: Windows, macOS, Linux (cross-platform CLI application)
**Project Type**: Single project
**Performance Goals**: UI renders must feel instantaneous (<100ms for navigation). CLI command output parsing should not block the UI. Long-running operations (dotnet pack, health checks) must show progress feedback.
**Constraints**: Must work in any terminal supporting ANSI escape sequences. No native dependencies (pure JavaScript packages only for cross-platform compatibility).
**Scale/Scope**: ~10 views, ~7 service modules, ~30 components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Component-First Architecture | PASS | All views are self-contained React components. Shared components in `components/shared/`. Feature components in feature directories (`sources/`, `cache/`, etc.). |
| II. Strict TypeScript & Modern Practices | PASS | `strict: true` in tsconfig. Discriminated unions for app state and navigation. `readonly` on all data interfaces. No `any`. `interface` for object shapes, `type` for unions. |
| III. Test-Driven Quality | PASS | Unit tests for all services and parsers. Component tests for UI views. Integration tests for multi-step workflows. Co-located test structure in `tests/`. |
| IV. Consistent User Experience | PASS | Shared `StatusBar` for keyboard hints. Shared `ConfirmDialog` for destructive actions. Shared `EmptyState` and `ErrorDisplay` for uniform feedback. `ListView` for consistent list navigation. Design tokens for colors/spacing. |
| V. Clean Code & Maintainability | PASS | Single-responsibility services. Files target <300 lines. Named constants for magic strings (source names, cache types). Side effects isolated in services layer. Pure rendering in components. |
| Technology Standards | PASS | ESM (`"type": "module"`), Prettier + ESLint, lockfile committed, path aliases configured in tsconfig. |

### Post-Phase 1 Re-Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Component-First Architecture | PASS | 6 feature component directories + shared directory. No component exceeds a single responsibility. `ListView` extracted as shared component used across Sources, Cache, Local Source, Search, and Config views. |
| II. Strict TypeScript & Modern Practices | PASS | All interfaces use `readonly`. `AppView` uses discriminated unions. `CacheType` is a string union, not an enum. No `any` types in design. |
| III. Test-Driven Quality | PASS | 3-tier test strategy: unit (services, parsers, utilities), component (Ink views), integration (full workflows). Test naming follows `describe("[Unit]", () => { it("SHOULD ... WHEN ...") })`. |
| IV. Consistent User Experience | PASS | All views share the same status bar pattern, list navigation (arrow keys, j/k, Enter, Escape), and confirmation flow. Error and loading states use shared components. |
| V. Clean Code & Maintainability | PASS | Service layer cleanly separates CLI interactions from UI. Components receive data via props; side effects happen in hooks that delegate to services. |

No violations found. Complexity Tracking section not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-nuget-tui-manager/
├── plan.md              # This file
├── research.md          # Phase 0 output — technology decisions and CLI research
├── data-model.md        # Phase 1 output — TypeScript interfaces and state model
├── quickstart.md        # Phase 1 output — setup instructions and project scaffold
├── contracts/
│   └── service-interfaces.md  # Phase 1 output — internal service contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── cli.tsx                        # Entry point: argument parsing, render(<App />)
├── app.tsx                        # Root component: navigation router, initialization
├── state/
│   ├── app-context.tsx            # React Context provider + hooks
│   └── app-reducer.ts             # Reducer, actions, initial state
├── services/
│   ├── dotnet-cli.ts              # Low-level dotnet CLI execution wrapper
│   ├── nuget-source.ts            # Source CRUD operations
│   ├── nuget-cache.ts             # Cache listing and clearing
│   ├── local-source.ts            # Local source lifecycle and package management
│   ├── package-metadata.ts        # .nupkg/.nuspec reading with adm-zip + fast-xml-parser
│   ├── package-search.ts          # Package search via dotnet package search --format json
│   ├── nuget-config.ts            # Config file discovery, reading, override analysis
│   └── app-config.ts              # App settings, OS-specific paths
├── components/
│   ├── shared/
│   │   ├── status-bar.tsx         # Bottom bar with context-sensitive keyboard hints
│   │   ├── error-display.tsx      # Consistent error rendering
│   │   ├── loading.tsx            # Spinner + message wrapper
│   │   ├── confirm-dialog.tsx     # Y/N confirmation using @inkjs/ui ConfirmInput
│   │   ├── empty-state.tsx        # "No items" message with guidance
│   │   └── list-view.tsx          # Navigable list with j/k/arrow/Enter/Esc support
│   ├── main-menu.tsx              # Dashboard with feature entry points
│   ├── sources/
│   │   ├── source-list.tsx        # Source listing with health indicators
│   │   ├── source-edit.tsx        # Edit source name/URL/enabled
│   │   └── source-add.tsx         # Add new source form
│   ├── cache/
│   │   ├── cache-list.tsx         # Cache types with disk usage
│   │   └── cache-browse.tsx       # Browse cache directory contents
│   ├── local-source/
│   │   ├── package-list.tsx       # Local packages with multi-select
│   │   └── add-package.tsx        # Add via file path or dotnet pack
│   ├── search/
│   │   ├── search-view.tsx        # Search input + streaming results
│   │   └── search-detail.tsx      # Package version details
│   ├── config/
│   │   ├── config-list.tsx        # Config file hierarchy
│   │   └── config-detail.tsx      # Config file contents with overrides
│   └── package-detail.tsx         # Shared package metadata display
├── hooks/
│   ├── use-navigation.ts          # Push/pop navigation with history
│   ├── use-async.ts               # Async operation with loading/error state
│   └── use-dotnet.ts              # dotnet CLI availability check
└── lib/
    ├── platform.ts                # OS detection, config/cache paths
    ├── format.ts                  # Byte formatting, string utilities
    ├── parse-cli-output.ts        # Parsers for dotnet nuget CLI text output
    ├── theme.ts                   # Design tokens: ANSI colors, spacing, text styles
    └── strings.ts                 # Externalized user-facing text constants

tests/
├── unit/
│   ├── services/
│   │   ├── dotnet-cli.test.ts
│   │   ├── nuget-source.test.ts
│   │   ├── nuget-cache.test.ts
│   │   ├── local-source.test.ts
│   │   ├── package-metadata.test.ts
│   │   └── package-search.test.ts
│   └── lib/
│       ├── platform.test.ts
│       ├── format.test.ts
│       └── parse-cli-output.test.ts
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

**Structure Decision**: Single project structure. This is a standalone CLI application with no backend/frontend split. All source code lives under `src/` with a clear separation between services (CLI interaction layer), components (UI layer), hooks (shared behavior), and lib (pure utilities). Tests mirror the source structure under `tests/`.
