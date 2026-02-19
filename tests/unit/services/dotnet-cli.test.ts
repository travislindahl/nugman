import { describe, it, expect, vi, afterEach } from "vitest";
import { execFile } from "node:child_process";

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
  spawn: vi.fn(),
}));

const execFileMock = vi.mocked(execFile);

describe("[Unit] DotnetCliService", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("checkAvailability", () => {
    it("SHOULD return available=true with version when dotnet is found", async () => {
      execFileMock.mockImplementation((_cmd, _args, cb) => {
        (cb as (err: null, result: { stdout: string }) => void)(null, {
          stdout: "9.0.100\n",
        });
        return undefined as never;
      });

      const { checkAvailability } = await import("@/services/dotnet-cli.js");
      const result = await checkAvailability();
      expect(result.available).toBe(true);
      expect(result.version).toBe("9.0.100");
    });

    it("SHOULD return available=false with ENOENT message when dotnet is not found", async () => {
      execFileMock.mockImplementation((_cmd, _args, cb) => {
        const err = new Error("spawn dotnet ENOENT") as Error & { code: string };
        err.code = "ENOENT";
        (cb as (err: Error) => void)(err);
        return undefined as never;
      });

      vi.resetModules();
      const { checkAvailability } = await import("@/services/dotnet-cli.js");
      const result = await checkAvailability();
      expect(result.available).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("SHOULD return available=false with error message on other errors", async () => {
      execFileMock.mockImplementation((_cmd, _args, cb) => {
        (cb as (err: Error) => void)(new Error("Permission denied"));
        return undefined as never;
      });

      vi.resetModules();
      const { checkAvailability } = await import("@/services/dotnet-cli.js");
      const result = await checkAvailability();
      expect(result.available).toBe(false);
      expect(result.error).toContain("Permission denied");
    });
  });

  describe("exec", () => {
    it("SHOULD return stdout from dotnet command", async () => {
      execFileMock.mockImplementation((_cmd, _args, _opts, cb) => {
        const callback = cb ?? _opts;
        (callback as (err: null, result: { stdout: string }) => void)(null, {
          stdout: "command output",
        });
        return undefined as never;
      });

      vi.resetModules();
      const { exec } = await import("@/services/dotnet-cli.js");
      const result = await exec(["nuget", "list", "source"]);
      expect(result).toBe("command output");
    });
  });
});
