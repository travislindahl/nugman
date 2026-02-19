// Source management
export interface NuGetSource {
  readonly name: string;
  readonly url: string;
  readonly enabled: boolean;
  readonly configLevel: ConfigLevel;
  readonly isManaged: boolean;
}

export type ConfigLevel = "user" | "project" | "machine";

// Cache management
export interface NuGetCacheLocation {
  readonly type: CacheType;
  readonly path: string;
  readonly diskUsageBytes: number;
}

export type CacheType = "http-cache" | "global-packages" | "temp" | "plugins-cache";

export interface CacheEntry {
  readonly name: string;
  readonly path: string;
  readonly sizeBytes: number;
  readonly isDirectory: boolean;
}

// Local source packages
export interface LocalSourcePackage {
  readonly id: string;
  readonly version: string;
  readonly fileName: string;
  readonly filePath: string;
  readonly fileSizeBytes: number;
}

// Package metadata (from .nuspec)
export interface PackageMetadata {
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

export interface PackageLicense {
  readonly type: "expression" | "file";
  readonly value: string;
}

export interface RepositoryInfo {
  readonly type: string;
  readonly url: string;
  readonly branch?: string;
  readonly commit?: string;
}

export interface DependencyGroup {
  readonly targetFramework?: string;
  readonly dependencies: readonly PackageDependency[];
}

export interface PackageDependency {
  readonly id: string;
  readonly versionRange: string;
}

// Package search
export interface PackageSearchResult {
  readonly sourceName: string;
  readonly packages: readonly SearchResultPackage[];
}

export interface SearchResultPackage {
  readonly id: string;
  readonly latestVersion: string;
  readonly description: string;
  readonly totalDownloads?: number;
  readonly owners?: string;
}

// NuGet config files
export interface NuGetConfigFile {
  readonly path: string;
  readonly level: ConfigFileLevel;
  readonly readable: boolean;
  readonly error?: string;
  readonly contents?: NuGetConfigContents;
}

export type ConfigFileLevel = "solution" | "user" | "machine" | "defaults";

export interface NuGetConfigContents {
  readonly sources: readonly ConfigSourceEntry[];
  readonly disabledSources: readonly string[];
  readonly packageSourceMappings: readonly PackageSourceMapping[];
  readonly otherSettings: ReadonlyMap<string, string>;
}

export interface ConfigSourceEntry {
  readonly name: string;
  readonly value: string;
  readonly protocolVersion?: string;
}

export interface PackageSourceMapping {
  readonly sourceKey: string;
  readonly patterns: readonly string[];
}

// Source health
export interface SourceHealthResult {
  readonly sourceName: string;
  readonly status: HealthStatus;
  readonly responseTimeMs?: number;
  readonly error?: string;
}

export type HealthStatus = "healthy" | "unhealthy" | "disabled" | "checking";

// App config
export interface AppConfig {
  readonly localSourceDir: string;
  readonly localSourceName: string;
}

// Service result types
export interface ClearResult {
  readonly success: boolean;
  readonly message: string;
  readonly failedItems?: readonly string[];
}

export type AddPackageResult =
  | { readonly kind: "success"; readonly package: LocalSourcePackage }
  | { readonly kind: "duplicate"; readonly existing: LocalSourcePackage }
  | { readonly kind: "error"; readonly message: string; readonly output?: string };

export interface PackageIdentity {
  readonly id: string;
  readonly version: string;
}

export type PackageMetadataResult =
  | { readonly kind: "success"; readonly metadata: PackageMetadata }
  | {
      readonly kind: "error";
      readonly message: string;
      readonly partialMetadata?: Partial<PackageMetadata>;
    };

export type ValidationResult =
  | { readonly kind: "valid" }
  | { readonly kind: "invalid"; readonly reason: string };

// Dotnet CLI types
export interface DotnetInfo {
  readonly available: boolean;
  readonly version?: string;
  readonly error?: string;
}

export interface ExecOptions {
  readonly cwd?: string;
  readonly timeoutMs?: number;
}

// Search options
export interface SearchOptions {
  readonly source?: string;
  readonly take?: number;
  readonly skip?: number;
  readonly prerelease?: boolean;
}

// Config override
export interface ConfigOverride {
  readonly setting: string;
  readonly section: string;
  readonly overriddenBy: string;
  readonly overrides: string;
  readonly value: string;
  readonly previousValue: string;
}
