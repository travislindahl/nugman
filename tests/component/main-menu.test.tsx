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

vi.mock("node:fs/promises", () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockRejectedValue(new Error("not found")),
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("[Component] MainMenu", () => {
  it("SHOULD render all menu entry points", async () => {
    const { lastFrame } = render(<App />);

    // Wait for dotnet check to complete
    await vi.waitFor(() => {
      const frame = lastFrame();
      expect(frame).toContain("Package Sources");
    });

    const frame = lastFrame();
    expect(frame).toContain("Package Sources");
    expect(frame).toContain("Cache Management");
    expect(frame).toContain("Local Source");
    expect(frame).toContain("Package Search");
    expect(frame).toContain("Config Viewer");
  });

  it("SHOULD render app title", async () => {
    const { lastFrame } = render(<App />);

    await vi.waitFor(() => {
      expect(lastFrame()).toContain("nugman");
    });
  });
});
