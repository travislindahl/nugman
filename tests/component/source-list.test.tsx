import { describe, it, expect, vi } from "vitest";
import { render } from "ink-testing-library";
import { App } from "@/app.js";

vi.mock("@/services/dotnet-cli.js", () => ({
  checkAvailability: vi.fn().mockResolvedValue({ available: true, version: "8.0.100" }),
  exec: vi.fn().mockResolvedValue(""),
}));

vi.mock("@/services/nuget-source.js", () => ({
  listSources: vi.fn().mockResolvedValue([
    {
      name: "nuget.org",
      url: "https://api.nuget.org/v3/index.json",
      enabled: true,
      configLevel: "user",
      isManaged: false,
    },
    {
      name: "local-feed",
      url: "/home/user/packages",
      enabled: false,
      configLevel: "user",
      isManaged: false,
    },
  ]),
  addSource: vi.fn().mockResolvedValue(undefined),
  removeSource: vi.fn().mockResolvedValue(undefined),
  enableSource: vi.fn().mockResolvedValue(undefined),
  disableSource: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("node:fs/promises", () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockRejectedValue(new Error("not found")),
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("[Component] SourceList", () => {
  it("SHOULD render source list when navigated to sources view", async () => {
    const { lastFrame, stdin } = render(<App />);

    // Wait for main menu
    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Package Sources");
    });

    // Select "Package Sources" (first item, press Enter)
    stdin.write("\r");

    // Wait for source list to load
    await vi.waitFor(() => {
      const frame = lastFrame();
      expect(frame).toContain("nuget.org");
    });

    const frame = lastFrame();
    expect(frame).toContain("nuget.org");
    expect(frame).toContain("local-feed");
  });
});
