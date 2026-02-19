import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";
import type {
  PackageIdentity,
  PackageMetadata,
  PackageMetadataResult,
  ValidationResult,
  DependencyGroup,
  PackageDependency,
  PackageLicense,
  RepositoryInfo,
} from "../types.js";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

function extractNuspec(nupkgPath: string): { zip: AdmZip; nuspecEntry: string; nuspecXml: string } {
  const zip = new AdmZip(nupkgPath);
  const entries = zip.getEntries();
  const nuspecEntry = entries.find((e) => e.entryName.endsWith(".nuspec"));
  if (!nuspecEntry) throw new Error("No .nuspec found in package");
  const nuspecXml = nuspecEntry.getData().toString("utf8");
  return { zip, nuspecEntry: nuspecEntry.entryName, nuspecXml };
}

export async function readIdentity(nupkgPath: string): Promise<PackageIdentity> {
  const { nuspecXml } = extractNuspec(nupkgPath);
  const parsed = xmlParser.parse(nuspecXml);
  const metadata = parsed?.package?.metadata;
  return {
    id: String(metadata?.id ?? "unknown"),
    version: String(metadata?.version ?? "0.0.0"),
  };
}

export async function readMetadata(nupkgPath: string): Promise<PackageMetadataResult> {
  try {
    const { zip, nuspecXml } = extractNuspec(nupkgPath);
    const parsed = xmlParser.parse(nuspecXml);
    const meta = parsed?.package?.metadata;

    if (!meta?.id || !meta?.version) {
      return { kind: "error", message: "Missing required fields (id, version)" };
    }

    const dependencies = parseDependencies(meta.dependencies);
    const targetFrameworks = extractTargetFrameworks(zip, dependencies);

    const license = parseLicense(meta.license);
    const repository = parseRepository(meta.repository);
    const tags = meta.tags ? String(meta.tags).split(/\s+/) : [];

    const metadata: PackageMetadata = {
      id: String(meta.id),
      version: String(meta.version),
      authors: String(meta.authors ?? ""),
      description: String(meta.description ?? ""),
      title: meta.title ? String(meta.title) : undefined,
      license,
      projectUrl: meta.projectUrl ? String(meta.projectUrl) : undefined,
      copyright: meta.copyright ? String(meta.copyright) : undefined,
      tags,
      releaseNotes: meta.releaseNotes ? String(meta.releaseNotes) : undefined,
      repository,
      dependencies,
      targetFrameworks,
    };

    return { kind: "success", metadata };
  } catch (err) {
    return {
      kind: "error",
      message: err instanceof Error ? err.message : "Failed to read metadata",
    };
  }
}

export async function validate(filePath: string): Promise<ValidationResult> {
  if (!filePath.endsWith(".nupkg")) {
    return { kind: "invalid", reason: "File must have .nupkg extension" };
  }

  try {
    const zip = new AdmZip(filePath);
    const entries = zip.getEntries();
    const nuspecEntry = entries.find((e) => e.entryName.endsWith(".nuspec"));
    if (!nuspecEntry) {
      return { kind: "invalid", reason: "Package does not contain a .nuspec file" };
    }

    const nuspecXml = nuspecEntry.getData().toString("utf8");
    const parsed = xmlParser.parse(nuspecXml);
    const meta = parsed?.package?.metadata;

    if (!meta) {
      return { kind: "invalid", reason: "Invalid .nuspec XML structure" };
    }

    const missing: string[] = [];
    if (!meta.id) missing.push("id");
    if (!meta.version) missing.push("version");
    if (!meta.description) missing.push("description");
    if (!meta.authors) missing.push("authors");

    if (missing.length > 0) {
      return { kind: "invalid", reason: `Missing required fields: ${missing.join(", ")}` };
    }

    return { kind: "valid" };
  } catch {
    return { kind: "invalid", reason: "File is not a valid ZIP archive" };
  }
}

function parseDependencies(deps: unknown): readonly DependencyGroup[] {
  if (!deps || typeof deps !== "object") return [];
  const d = deps as Record<string, unknown>;
  const groups: DependencyGroup[] = [];

  // Handle <group> elements
  const rawGroups = Array.isArray(d.group) ? d.group : d.group ? [d.group] : [];
  for (const g of rawGroups as Record<string, unknown>[]) {
    const rawDeps = Array.isArray(g.dependency) ? g.dependency : g.dependency ? [g.dependency] : [];
    const dependencies: PackageDependency[] = (rawDeps as Record<string, unknown>[]).map((dep) => ({
      id: String(dep["@_id"] ?? ""),
      versionRange: String(dep["@_version"] ?? ""),
    }));
    groups.push({
      targetFramework: g["@_targetFramework"] ? String(g["@_targetFramework"]) : undefined,
      dependencies,
    });
  }

  // Handle flat <dependency> elements (no groups)
  if (groups.length === 0) {
    const rawDeps = Array.isArray(d.dependency) ? d.dependency : d.dependency ? [d.dependency] : [];
    if (rawDeps.length > 0) {
      groups.push({
        dependencies: (rawDeps as Record<string, unknown>[]).map((dep) => ({
          id: String(dep["@_id"] ?? ""),
          versionRange: String(dep["@_version"] ?? ""),
        })),
      });
    }
  }

  return groups;
}

function extractTargetFrameworks(
  zip: AdmZip,
  dependencies: readonly DependencyGroup[],
): readonly string[] {
  const frameworks = new Set<string>();

  // From dependency groups
  for (const group of dependencies) {
    if (group.targetFramework) frameworks.add(group.targetFramework);
  }

  // From lib/ folder
  for (const entry of zip.getEntries()) {
    const match = entry.entryName.match(/^lib\/([^/]+)\//);
    if (match?.[1]) frameworks.add(match[1]);
  }

  return [...frameworks];
}

function parseLicense(license: unknown): PackageLicense | undefined {
  if (!license) return undefined;
  if (typeof license === "string") return { type: "expression", value: license };
  if (typeof license === "object" && license !== null) {
    const l = license as Record<string, unknown>;
    return {
      type: l["@_type"] === "file" ? "file" : "expression",
      value: String(l["#text"] ?? ""),
    };
  }
  return undefined;
}

function parseRepository(repo: unknown): RepositoryInfo | undefined {
  if (!repo || typeof repo !== "object") return undefined;
  const r = repo as Record<string, unknown>;
  return {
    type: String(r["@_type"] ?? ""),
    url: String(r["@_url"] ?? ""),
    branch: r["@_branch"] ? String(r["@_branch"]) : undefined,
    commit: r["@_commit"] ? String(r["@_commit"]) : undefined,
  };
}
