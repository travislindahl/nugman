import { describe, it, expect, vi } from "vitest";
import * as metadataService from "@/services/package-metadata.js";

const NUSPEC_XML = `<?xml version="1.0"?>
<package>
  <metadata>
    <id>TestPackage</id>
    <version>1.0.0</version>
    <authors>Test Author</authors>
    <description>A test package</description>
  </metadata>
</package>`;

vi.mock("adm-zip", () => {
  return {
    default: class MockAdmZip {
      getEntries() {
        return [
          {
            entryName: "TestPackage.nuspec",
            getData: () => Buffer.from(NUSPEC_XML),
          },
        ];
      }
    },
  };
});

describe("[Unit] PackageMetadataService", () => {
  describe("readIdentity", () => {
    it("SHOULD extract id and version from .nuspec", async () => {
      const identity = await metadataService.readIdentity("/path/to/package.nupkg");
      expect(identity.id).toBe("TestPackage");
      expect(identity.version).toBe("1.0.0");
    });
  });

  describe("validate", () => {
    it("SHOULD reject non-.nupkg files", async () => {
      const result = await metadataService.validate("/path/to/file.txt");
      expect(result.kind).toBe("invalid");
      if (result.kind === "invalid") {
        expect(result.reason).toContain(".nupkg");
      }
    });

    it("SHOULD accept valid .nupkg files", async () => {
      const result = await metadataService.validate("/path/to/package.nupkg");
      expect(result.kind).toBe("valid");
    });
  });

  describe("readMetadata", () => {
    it("SHOULD parse full metadata from .nuspec", async () => {
      const result = await metadataService.readMetadata("/path/to/package.nupkg");
      expect(result.kind).toBe("success");
      if (result.kind === "success") {
        expect(result.metadata.id).toBe("TestPackage");
        expect(result.metadata.version).toBe("1.0.0");
        expect(result.metadata.authors).toBe("Test Author");
        expect(result.metadata.description).toBe("A test package");
      }
    });
  });
});
