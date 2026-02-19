# Research: NuGet TUI Manager

**Feature Branch**: `001-nuget-tui-manager`
**Date**: 2026-02-18

## Technology Decisions

### Decision 1: TUI Framework

- **Decision**: Ink 6.8.0 with React 19
- **Rationale**: Ink is the most mature React-based terminal UI framework. Version 6.8.0 is the latest stable release, uses React 19, requires Node >= 20, and is ESM-only (`"type": "module"`). It provides a flexbox-based layout system via yoga-layout 3.2.1, built-in keyboard input handling via `useInput` hook, focus management via `useFocus`/`useFocusManager`, and a component model identical to React DOM.
- **Alternatives considered**:
  - **Blessed/neo-blessed**: Lower-level, not component-based, poor TypeScript support, unmaintained
  - **Terminal-kit**: Imperative API, not React-based, harder to compose complex UIs
  - **Custom ANSI rendering**: Too much effort, reinventing the wheel

### Decision 2: UI Component Library

- **Decision**: `@inkjs/ui` 2.0.0
- **Rationale**: Official companion library by the Ink author. Provides `TextInput`, `Select`, `ConfirmInput`, `Spinner`, `ProgressBar`, and `StatusMessage` components. Peer dependency is `ink >= 5`, so compatible with Ink 6.8.0. These components directly address the spec requirements for keyboard-driven navigation, confirmations, and text input.
- **Alternatives considered**:
  - **Individual ink-* packages** (ink-select-input, ink-text-input, etc.): Many are not updated for Ink 6.x / React 19. Using the official `@inkjs/ui` bundle reduces compatibility risk.
  - **Custom components only**: Higher development effort for standard UI patterns already solved by `@inkjs/ui`.

### Decision 3: TypeScript Configuration

- **Decision**: TypeScript 5.9.x with strict mode, targeting ESM (`"module": "nodenext"`, `"moduleResolution": "nodenext"`)
- **Rationale**: Latest stable TypeScript. Strict mode is mandated by the constitution. ESM is required by Ink 6.x. `nodenext` module resolution properly handles ESM imports with file extensions.
- **Alternatives considered**:
  - **TypeScript 5.7/5.8**: No reason to use older versions; 5.9 is stable and compatible.
  - **`"module": "esnext"`**: `nodenext` is more correct for Node.js-targeted ESM code.

### Decision 4: Testing Framework

- **Decision**: Vitest 4.x with `ink-testing-library` 4.0.0
- **Rationale**: Vitest has first-class ESM support (critical for Ink 6.x), fast execution, and React/JSX support. `ink-testing-library` provides `render()`, `lastFrame()`, and `stdin.write()` for testing Ink components. Vitest's API is Jest-compatible, making constitution test naming conventions (`describe`/`it`) straightforward.
- **Alternatives considered**:
  - **Jest**: ESM support is experimental and requires configuration hacks. Vitest is the better choice for ESM-only projects.
  - **Node.js test runner**: Lacks JSX/TSX transform support needed for Ink components.

### Decision 5: Package Manager

- **Decision**: npm (lockfile committed)
- **Rationale**: Standard Node.js package manager, no additional installation required. Constitution requires a consistent package manager with committed lockfile. npm is the simplest choice for a project with no monorepo structure.
- **Alternatives considered**:
  - **pnpm**: Faster, better disk usage, but adds a dependency for contributors. Could reconsider if performance becomes an issue.
  - **yarn**: No compelling advantage over npm for this project scope.

### Decision 6: dotnet CLI Integration

- **Decision**: Use `node:child_process` (`execFile` for quick commands, `spawn` for streaming `dotnet pack` output)
- **Rationale**: The dotnet CLI provides all NuGet management commands needed. No Node.js NuGet client library exists that covers source management, cache management, and local feeds. The CLI approach is reliable, cross-platform, and keeps the application simple.
- **Key commands**:
  - `dotnet nuget list source --format Detailed` — parse text output (no JSON format available)
  - `dotnet nuget add/update/remove/enable/disable source` — source management
  - `dotnet nuget locals all --list --force-english-output` — cache location listing
  - `dotnet nuget locals <type> --clear` — cache clearing
  - `dotnet package search <term> --format json` — JSON output available
  - `dotnet pack <project> -o <dir> -c Release --nologo` — build and pack
- **Alternatives considered**:
  - **Direct NuGet.Config XML manipulation**: More fragile, doesn't respect the full config hierarchy, and requires reimplementing merge logic. Using the CLI ensures we get the same behavior as `dotnet restore`.
  - **NuGet Server API (v3)**: Only covers search/download, not source management or cache management.

### Decision 7: .nupkg Metadata Reading

- **Decision**: `adm-zip` for ZIP extraction + `fast-xml-parser` for .nuspec XML parsing
- **Rationale**: `.nupkg` files are ZIP archives containing a `.nuspec` XML manifest. `adm-zip` (v3.2.0) is a pure-JavaScript ZIP library with a simple synchronous API suitable for reading small archives. `fast-xml-parser` (v5.3.6) is a performant, pure-JavaScript XML parser with no native dependencies.
- **Alternatives considered**:
  - **yauzl**: Streaming/async API, more complex for the simple "read one file from ZIP" use case. Better for large files, but .nupkg files are typically small.
  - **JSZip**: Promise-based, heavier dependency designed for browser+Node. Overkill for server-side only.
  - **xml2js**: Older, less performant than fast-xml-parser, uses callbacks.

### Decision 8: Application Configuration Directory

- **Decision**: OS-specific paths per spec, using `env-paths` or manual construction
- **Rationale**: The spec mandates `~/.config/nugman` (Linux), `~/Library/Application Support/nugman` (macOS), `%APPDATA%\nugman` (Windows). Node.js provides `process.platform` and `os.homedir()` for path construction.
- **Implementation**:
  - Windows: `process.env.APPDATA + '/nugman'`
  - macOS: `os.homedir() + '/Library/Application Support/nugman'`
  - Linux: `(process.env.XDG_CONFIG_HOME || os.homedir() + '/.config') + '/nugman'`
- **Local source directory**: `<config-dir>/local-source/`

### Decision 9: Build System / Compilation

- **Decision**: `tsx` for development (run TypeScript directly), `tsc` for type checking
- **Rationale**: `tsx` runs TypeScript files directly without a separate compile step, supporting ESM and JSX. `tsc` is used only for type checking (`tsc --noEmit`). For distribution, we'll compile with `tsc` to JavaScript. This keeps the development workflow fast while maintaining type safety.
- **Alternatives considered**:
  - **ts-node**: ESM support is less reliable than `tsx`.
  - **esbuild bundling**: Unnecessary complexity for a CLI application; Node.js can run the compiled JS directly.

### Decision 10: State Management

- **Decision**: React Context + `useReducer` for global app state; `useState` for local component state
- **Rationale**: The application has a moderate number of views with shared state (current view, loaded sources, cache info). React Context with `useReducer` provides sufficient state management without external dependencies. This aligns with the constitution's principle of minimizing dependencies.
- **Alternatives considered**:
  - **Zustand**: Lightweight and works with React, but adds a dependency for what Context handles well.
  - **Jotai**: Atomic state model is elegant but adds complexity and a dependency.

## CLI Output Parsing

### `dotnet nuget list source --format Detailed`

No JSON format available. Must parse text output:

```
Registered Sources:
  1.  nuget.org [Enabled]
      https://api.nuget.org/v3/index.json
  2.  MyPrivate [Disabled]
      https://myserver/nuget/v3/index.json
```

Parse strategy: Match lines with regex pattern for source index, name, and status, followed by URL on the next indented line. The `--format Detailed` output includes the source name (which `Short` format does not).

### `dotnet nuget locals all --list --force-english-output`

Text output with optional `info : ` prefix:

```
info : http-cache: /home/user/.local/share/NuGet/v3-cache
info : global-packages: /home/user/.nuget/packages/
info : temp: /tmp/NuGetScratch
info : plugins-cache: /home/user/.local/share/NuGet/plugins-cache
```

Parse strategy: Strip `info : ` prefix, split on first `: ` to get key-value pairs. Always use `--force-english-output` for consistent locale-independent parsing.

### `dotnet package search <term> --format json`

JSON output is available:

```json
{
  "version": 2,
  "problems": [],
  "searchResult": [
    {
      "sourceName": "https://api.nuget.org/v3/index.json",
      "packages": [
        {
          "id": "Newtonsoft.Json",
          "latestVersion": "13.0.3",
          "totalDownloads": 4456137550,
          "owners": "dotnetfoundation, jamesnk, newtonsoft"
        }
      ]
    }
  ]
}
```

Parse strategy: Use `JSON.parse()` directly. Handle `problems` array for error reporting.

## NuGet Configuration Hierarchy

Precedence (lowest to highest):
1. `NuGetDefaults.Config` (uncommon, admin-deployed)
2. Computer-level config file
3. User-level config file
4. Directory-walk config files (from drive root to current directory)

The "closest" config file wins for single-value settings. Collection settings (like `<packageSources>`) are merged from all files. `<clear />` resets a collection.

### Config File Locations

| Level | Windows | macOS | Linux |
|-------|---------|-------|-------|
| User | `%APPDATA%\NuGet\NuGet.Config` | `~/.nuget/NuGet/NuGet.Config` | `~/.nuget/NuGet/NuGet.Config` |
| Computer | `%ProgramFiles(x86)%\NuGet\Config` | `/Library/Application Support` | `/etc/opt/NuGet/Config` |
| Solution | Walk up from cwd, any `nuget.config` | Same | Same |

## .nupkg Validation Strategy

Tiered validation for adding packages to local source:

1. **File extension**: Must be `.nupkg`
2. **Valid ZIP**: Open with adm-zip; error = not a valid archive
3. **Contains .nuspec**: Scan entries for `*.nuspec`; missing = not a valid package
4. **Valid XML**: Parse .nuspec with fast-xml-parser; error = malformed manifest
5. **Required fields**: Check for `<id>`, `<version>`, `<description>`, `<authors>`; report which fields are absent

## Dependency Version Matrix

| Package | Version | Peer Dependencies |
|---------|---------|-------------------|
| ink | 6.8.0 | react >= 19, @types/react >= 19 |
| @inkjs/ui | 2.0.0 | ink >= 5 |
| react | 19.x | — |
| @types/react | >= 19 | — |
| typescript | 5.9.x | — |
| vitest | 4.x | — |
| ink-testing-library | 4.0.0 | @types/react >= 18 |
| adm-zip | 3.2.x | — |
| fast-xml-parser | 5.3.x | — |
| tsx | latest | — |
