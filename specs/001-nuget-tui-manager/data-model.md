# Data Model: NuGet TUI Manager

**Feature Branch**: `001-nuget-tui-manager`
**Date**: 2026-02-18

## Entities

### NuGetSource

Represents a configured NuGet package source from the merged configuration hierarchy.

```typescript
interface NuGetSource {
  readonly name: string;
  readonly url: string;
  readonly enabled: boolean;
  readonly configLevel: ConfigLevel;
  readonly isManaged: boolean; // true for the app-managed local source
}

type ConfigLevel = "user" | "project" | "machine";
```

**Validation rules**:
- `name` must be non-empty, unique across all sources
- `url` must be a valid URL or filesystem path
- Only sources with `configLevel === "user"` are editable/deletable
- When `isManaged === true`: name and url are read-only, cannot be deleted, only `enabled` can be toggled

**State transitions**:
- `enabled: true` ↔ `enabled: false` (toggle via dotnet CLI)
- User-level sources can be created, updated, and deleted
- Project/machine-level sources are read-only in the UI

---

### NuGetCacheLocation

Represents a NuGet local cache directory.

```typescript
interface NuGetCacheLocation {
  readonly type: CacheType;
  readonly path: string;
  readonly diskUsageBytes: number;
}

type CacheType = "http-cache" | "global-packages" | "temp" | "plugins-cache";
```

**Validation rules**:
- `path` is obtained from `dotnet nuget locals` and is read-only
- `diskUsageBytes` is computed by scanning the directory; refreshed on demand

**State transitions**:
- Cache can be cleared → `diskUsageBytes` resets to 0 (or near-zero)
- After clearing, contents list becomes empty

---

### CacheEntry

Represents a file or directory within a cache location.

```typescript
interface CacheEntry {
  readonly name: string;
  readonly path: string;
  readonly sizeBytes: number;
  readonly isDirectory: boolean;
}
```

---

### LocalSourcePackage

Represents a .nupkg file in the managed local NuGet source.

```typescript
interface LocalSourcePackage {
  readonly id: string;
  readonly version: string;
  readonly fileName: string;
  readonly filePath: string;
  readonly fileSizeBytes: number;
}
```

**Validation rules**:
- `id` and `version` are extracted from the .nuspec inside the .nupkg
- `fileName` is the actual filename on disk
- `filePath` is the absolute path to the .nupkg file

**State transitions**:
- Package can be added (file copy or dotnet pack) → appears in list
- Package can be removed (file delete) → disappears from list
- Duplicate detection: same `id` + `version` triggers overwrite prompt

---

### PackageMetadata

Detailed metadata extracted from a .nupkg file's .nuspec manifest.

```typescript
interface PackageMetadata {
  readonly id: string;
  readonly version: string;
  readonly authors: string;
  readonly description: string;
  readonly title?: string;
  readonly license?: PackageLicense;
  readonly projectUrl?: string;
  readonly copyright?: string;
  readonly tags: readonly string[];
  readonly releaseNotes?: string;
  readonly repository?: RepositoryInfo;
  readonly dependencies: readonly DependencyGroup[];
  readonly targetFrameworks: readonly string[];
}

interface PackageLicense {
  readonly type: "expression" | "file";
  readonly value: string;
}

interface RepositoryInfo {
  readonly type: string;
  readonly url: string;
  readonly branch?: string;
  readonly commit?: string;
}

interface DependencyGroup {
  readonly targetFramework?: string;
  readonly dependencies: readonly PackageDependency[];
}

interface PackageDependency {
  readonly id: string;
  readonly versionRange: string;
}
```

**Validation rules**:
- `id`, `version`, `description`, and `authors` are required in a valid .nuspec
- `dependencies` may be empty (no dependencies)
- `targetFrameworks` derived from both .nuspec dependency groups and `lib/` folder structure
- Malformed/missing optional fields should be represented as `undefined`, not cause failures

---

### PackageSearchResult

Result from `dotnet package search`.

```typescript
interface PackageSearchResult {
  readonly sourceName: string;
  readonly packages: readonly SearchResultPackage[];
}

interface SearchResultPackage {
  readonly id: string;
  readonly latestVersion: string;
  readonly description: string;
  readonly totalDownloads?: number;
  readonly owners?: string;
}
```

---

### NuGetConfigFile

A configuration file in the NuGet config hierarchy.

```typescript
interface NuGetConfigFile {
  readonly path: string;
  readonly level: ConfigFileLevel;
  readonly readable: boolean;
  readonly error?: string;
  readonly contents?: NuGetConfigContents;
}

type ConfigFileLevel = "solution" | "user" | "machine" | "defaults";

interface NuGetConfigContents {
  readonly sources: readonly ConfigSourceEntry[];
  readonly disabledSources: readonly string[];
  readonly packageSourceMappings: readonly PackageSourceMapping[];
  readonly otherSettings: ReadonlyMap<string, string>;
}

interface ConfigSourceEntry {
  readonly name: string;
  readonly value: string;
  readonly protocolVersion?: string;
}

interface PackageSourceMapping {
  readonly sourceKey: string;
  readonly patterns: readonly string[];
}
```

**Validation rules**:
- `readable` is `false` when the file cannot be read (permissions, corruption)
- `error` contains the reason when `readable` is `false`
- `contents` is only populated when `readable` is `true`

---

### SourceHealthResult

Result of a source health/reachability check.

```typescript
interface SourceHealthResult {
  readonly sourceName: string;
  readonly status: HealthStatus;
  readonly responseTimeMs?: number;
  readonly error?: string;
}

type HealthStatus = "healthy" | "unhealthy" | "disabled" | "checking";
```

---

### AppConfig

Persistent application configuration.

```typescript
interface AppConfig {
  readonly localSourceDir: string;
  readonly localSourceName: string;
}
```

**Default values**:
- `localSourceDir`: `<os-config-dir>/nugman/local-source`
- `localSourceName`: `"nugman-local"`

---

## Application State

### Navigation State

```typescript
type AppView =
  | { readonly kind: "main-menu" }
  | { readonly kind: "sources" }
  | { readonly kind: "source-edit"; readonly sourceName: string }
  | { readonly kind: "source-add" }
  | { readonly kind: "cache" }
  | { readonly kind: "cache-browse"; readonly cacheType: CacheType }
  | { readonly kind: "local-source" }
  | { readonly kind: "local-source-add" }
  | { readonly kind: "package-detail"; readonly packagePath: string }
  | { readonly kind: "package-search" }
  | { readonly kind: "search-result-detail"; readonly packageId: string; readonly sourceName: string }
  | { readonly kind: "config-viewer" }
  | { readonly kind: "config-file-detail"; readonly filePath: string };
```

Uses discriminated unions per constitution principle II (prefer discriminated unions over loose string enums for state).

### Global App State

```typescript
interface AppState {
  readonly currentView: AppView;
  readonly viewHistory: readonly AppView[];
  readonly sources: readonly NuGetSource[];
  readonly cacheLocations: readonly NuGetCacheLocation[];
  readonly localPackages: readonly LocalSourcePackage[];
  readonly error?: string;
  readonly loading: boolean;
}
```

### App State Actions

```typescript
type AppAction =
  | { readonly type: "NAVIGATE"; readonly view: AppView }
  | { readonly type: "GO_BACK" }
  | { readonly type: "SET_SOURCES"; readonly sources: readonly NuGetSource[] }
  | { readonly type: "SET_CACHE_LOCATIONS"; readonly locations: readonly NuGetCacheLocation[] }
  | { readonly type: "SET_LOCAL_PACKAGES"; readonly packages: readonly LocalSourcePackage[] }
  | { readonly type: "SET_ERROR"; readonly error: string }
  | { readonly type: "CLEAR_ERROR" }
  | { readonly type: "SET_LOADING"; readonly loading: boolean };
```
