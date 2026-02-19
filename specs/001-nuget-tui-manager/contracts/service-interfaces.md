# Service Contracts: NuGet TUI Manager

**Feature Branch**: `001-nuget-tui-manager`
**Date**: 2026-02-18

This application is a TUI (not a web API), so contracts define internal service interfaces rather than REST endpoints. These interfaces represent the boundary between UI components and the underlying dotnet CLI / filesystem operations.

## Service Interfaces

### NuGetSourceService

Manages NuGet package source configuration via `dotnet nuget` CLI commands.

```typescript
interface NuGetSourceService {
  /** List all configured sources from the merged config hierarchy */
  listSources(): Promise<readonly NuGetSource[]>;

  /** Add a new source to the user-level config */
  addSource(name: string, url: string): Promise<void>;

  /** Update an existing user-level source */
  updateSource(name: string, newName?: string, newUrl?: string): Promise<void>;

  /** Remove a source from the user-level config */
  removeSource(name: string): Promise<void>;

  /** Enable a source */
  enableSource(name: string): Promise<void>;

  /** Disable a source */
  disableSource(name: string): Promise<void>;

  /** Check reachability of a source (HTTP HEAD or similar) */
  checkHealth(source: NuGetSource): Promise<SourceHealthResult>;

  /** Check health of all enabled sources concurrently */
  checkAllHealth(sources: readonly NuGetSource[]): Promise<readonly SourceHealthResult[]>;
}
```

**CLI mappings**:
| Method | CLI Command |
|--------|-------------|
| `listSources()` | `dotnet nuget list source --format Detailed` |
| `addSource(name, url)` | `dotnet nuget add source <url> --name <name>` |
| `updateSource(name, ...)` | `dotnet nuget update source <name> --source <url>` |
| `removeSource(name)` | `dotnet nuget remove source <name>` |
| `enableSource(name)` | `dotnet nuget enable source <name>` |
| `disableSource(name)` | `dotnet nuget disable source <name>` |
| `checkHealth(source)` | HTTP HEAD request to source URL |

**Error cases**:
- Source name already exists on add → throw with descriptive message
- Source not found on update/remove → throw with descriptive message
- CLI not available → throw `DotnetNotFoundError`
- Permission denied → throw with OS-appropriate guidance

---

### NuGetCacheService

Manages NuGet local caches via `dotnet nuget locals` CLI commands.

```typescript
interface NuGetCacheService {
  /** List all cache locations with their paths */
  listCacheLocations(): Promise<readonly NuGetCacheLocation[]>;

  /** Calculate disk usage for a cache directory */
  calculateDiskUsage(path: string): Promise<number>;

  /** List contents of a cache directory */
  listCacheContents(path: string): Promise<readonly CacheEntry[]>;

  /** Clear a specific cache type */
  clearCache(type: CacheType): Promise<ClearResult>;

  /** Clear all caches */
  clearAllCaches(): Promise<ClearResult>;
}

interface ClearResult {
  readonly success: boolean;
  readonly message: string;
  readonly failedItems?: readonly string[];
}
```

**CLI mappings**:
| Method | CLI Command |
|--------|-------------|
| `listCacheLocations()` | `dotnet nuget locals all --list --force-english-output` |
| `clearCache(type)` | `dotnet nuget locals <type> --clear` |
| `clearAllCaches()` | `dotnet nuget locals all --clear` |

**Note**: `calculateDiskUsage()` and `listCacheContents()` use filesystem operations (Node.js `fs` module), not CLI commands.

---

### LocalSourceService

Manages the application's local NuGet source directory.

```typescript
interface LocalSourceService {
  /** Ensure the local source directory exists and is registered as a NuGet source */
  initialize(): Promise<void>;

  /** List all packages in the local source */
  listPackages(): Promise<readonly LocalSourcePackage[]>;

  /** Add a .nupkg file to the local source (copy) */
  addPackageFromFile(nupkgPath: string): Promise<AddPackageResult>;

  /** Build a project and add resulting .nupkg to local source */
  addPackageFromBuild(
    projectPath: string,
    onOutput: (line: string) => void,
  ): Promise<AddPackageResult>;

  /** Remove a package from the local source */
  removePackage(filePath: string): Promise<void>;

  /** Remove multiple packages from the local source */
  removePackages(filePaths: readonly string[]): Promise<void>;

  /** Check if a package with the same ID and version already exists */
  checkDuplicate(id: string, version: string): Promise<LocalSourcePackage | undefined>;

  /** Get the local source directory path */
  getLocalSourcePath(): string;
}

type AddPackageResult =
  | { readonly kind: "success"; readonly package: LocalSourcePackage }
  | { readonly kind: "duplicate"; readonly existing: LocalSourcePackage }
  | { readonly kind: "error"; readonly message: string; readonly output?: string };
```

**Implementation details**:
- `initialize()`:
  1. Create local source directory if missing (`fs.mkdir` with `{ recursive: true }`)
  2. Check if source is registered (`listSources()` → find by name)
  3. If not registered, run `dotnet nuget add source <path> --name nugman-local`
- `addPackageFromFile()`:
  1. Validate the .nupkg (tiered validation from research)
  2. Extract ID and version from .nuspec
  3. Check for duplicates
  4. Copy file to local source directory
- `addPackageFromBuild()`:
  1. Run `dotnet pack <project> -o <local-source-dir> -c Release --nologo` via `spawn`
  2. Stream stdout/stderr to `onOutput` callback
  3. On completion, scan output dir for new .nupkg files

---

### PackageMetadataService

Reads metadata from .nupkg files.

```typescript
interface PackageMetadataService {
  /** Read full metadata from a .nupkg file */
  readMetadata(nupkgPath: string): Promise<PackageMetadataResult>;

  /** Read only ID and version (quick check for duplicate detection) */
  readIdentity(nupkgPath: string): Promise<PackageIdentity>;

  /** Validate that a file is a valid .nupkg */
  validate(filePath: string): Promise<ValidationResult>;
}

interface PackageIdentity {
  readonly id: string;
  readonly version: string;
}

type PackageMetadataResult =
  | { readonly kind: "success"; readonly metadata: PackageMetadata }
  | { readonly kind: "error"; readonly message: string; readonly partialMetadata?: Partial<PackageMetadata> };

type ValidationResult =
  | { readonly kind: "valid" }
  | { readonly kind: "invalid"; readonly reason: string };
```

**Implementation**: Uses `adm-zip` to open the .nupkg, extract the .nuspec, and `fast-xml-parser` to parse the XML.

---

### PackageSearchService

Searches for packages across configured NuGet sources.

```typescript
interface PackageSearchService {
  /** Search for packages across all enabled sources */
  search(
    term: string,
    options?: SearchOptions,
  ): Promise<readonly PackageSearchResult[]>;
}

interface SearchOptions {
  readonly source?: string;
  readonly take?: number;
  readonly skip?: number;
  readonly prerelease?: boolean;
}
```

**CLI mapping**: `dotnet package search <term> --format json [--source <source>] [--take <n>] [--skip <n>] [--prerelease]`

**Error handling**: When a source is unreachable, the JSON output includes `problems` entries. These should be reported per-source without blocking results from other sources.

---

### NuGetConfigService

Reads and analyzes NuGet configuration files.

```typescript
interface NuGetConfigService {
  /** List all config files in the hierarchy with their precedence */
  listConfigFiles(): Promise<readonly NuGetConfigFile[]>;

  /** Read and parse a specific config file */
  readConfigFile(path: string): Promise<NuGetConfigContents>;

  /** Compute setting overrides between config files */
  computeOverrides(
    files: readonly NuGetConfigFile[],
  ): Promise<readonly ConfigOverride[]>;
}

interface ConfigOverride {
  readonly setting: string;
  readonly section: string;
  readonly overriddenBy: string; // file path of overriding config
  readonly overrides: string; // file path of overridden config
  readonly value: string;
  readonly previousValue: string;
}
```

**Implementation details**:
- Config file discovery: Walk up from cwd checking for `nuget.config`, plus known user/machine paths
- XML parsing: Use `fast-xml-parser` to parse NuGet.Config XML
- Override detection: Compare settings across files in precedence order

---

### DotnetCliService

Low-level service for executing dotnet CLI commands.

```typescript
interface DotnetCliService {
  /** Check if dotnet CLI is available on PATH */
  checkAvailability(): Promise<DotnetInfo>;

  /** Execute a dotnet command and return stdout */
  exec(args: readonly string[], options?: ExecOptions): Promise<string>;

  /** Execute a dotnet command with streaming output */
  spawn(
    args: readonly string[],
    onStdout: (line: string) => void,
    onStderr: (line: string) => void,
    options?: ExecOptions,
  ): Promise<number>;
}

interface DotnetInfo {
  readonly available: boolean;
  readonly version?: string;
  readonly error?: string;
}

interface ExecOptions {
  readonly cwd?: string;
  readonly timeoutMs?: number;
}
```

**Implementation**: Wraps `node:child_process` `execFile` (promisified) and `spawn`. Handles `ENOENT` for missing dotnet CLI detection (FR-020).

---

### AppConfigService

Manages persistent application configuration.

```typescript
interface AppConfigService {
  /** Get the OS-appropriate config directory path */
  getConfigDir(): string;

  /** Load application config (creates defaults if missing) */
  loadConfig(): Promise<AppConfig>;

  /** Save application config */
  saveConfig(config: AppConfig): Promise<void>;
}
```

**Platform paths**:
- Windows: `%APPDATA%/nugman/`
- macOS: `~/Library/Application Support/nugman/`
- Linux: `${XDG_CONFIG_HOME:-~/.config}/nugman/`
