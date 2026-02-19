import { describe, it, expect, vi } from "vitest";
import { render } from "ink-testing-library";
import { App } from "@/app.js";

vi.mock("@/services/dotnet-cli.js", () => ({
  checkAvailability: vi.fn().mockResolvedValue({ available: true, version: "8.0.100" }),
  exec: vi.fn().mockResolvedValue(""),
}));

vi.mock("@/services/nuget-source.js", () => ({
  listSources: vi.fn().mockResolvedValue([]),
  addSource: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/services/local-source.js", () => ({
  initialize: vi.fn().mockResolvedValue(undefined),
  getLocalSourcePath: vi.fn().mockReturnValue("/tmp/local-source"),
  listPackages: vi.fn().mockResolvedValue([
    {
      id: "MyPackage",
      version: "1.0.0",
      fileName: "MyPackage.1.0.0.nupkg",
      filePath: "/tmp/local-source/MyPackage.1.0.0.nupkg",
      fileSizeBytes: 2048,
    },
  ]),
  removePackage: vi.fn().mockResolvedValue(undefined),
  removePackages: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("node:fs/promises", () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockRejectedValue(new Error("not found")),
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("[Component] PackageList", () => {
  it("SHOULD render packages when navigated to local source view", async () => {
    const { lastFrame, stdin } = render(<App />);

    // Wait for main menu
    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Local Source");
    });

    // Navigate to "Local Source" (third item)
    stdin.write("j");
    await new Promise((r) => setTimeout(r, 50));
    stdin.write("j");
    await new Promise((r) => setTimeout(r, 50));
    stdin.write("\r");

    // Wait for package list to load
    await vi.waitFor(
      () => {
        const frame = lastFrame();
        expect(frame).toContain("MyPackage");
      },
      { timeout: 3000 },
    );

    const frame = lastFrame();
    expect(frame).toContain("MyPackage");
    expect(frame).toContain("1.0.0");
  });
});
