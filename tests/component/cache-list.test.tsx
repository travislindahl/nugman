import { describe, it, expect, vi } from "vitest";
import { render } from "ink-testing-library";
import { App } from "@/app.js";

vi.mock("@/services/dotnet-cli.js", () => ({
  checkAvailability: vi.fn().mockResolvedValue({ available: true, version: "8.0.100" }),
  exec: vi.fn().mockResolvedValue(
    `info : http-cache: /tmp/cache
info : global-packages: /tmp/packages
info : temp: /tmp/scratch
info : plugins-cache: /tmp/plugins
`,
  ),
}));

vi.mock("node:fs/promises", () => ({
  default: {
    readdir: vi.fn().mockResolvedValue([]),
    stat: vi.fn().mockResolvedValue({ size: 0 }),
    mkdir: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockRejectedValue(new Error("not found")),
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("[Component] CacheList", () => {
  it("SHOULD render cache types when navigated to cache view", async () => {
    const { lastFrame, stdin } = render(<App />);

    // Wait for main menu
    await vi.waitFor(() => {
      expect(lastFrame()).toContain("Cache Management");
    });

    // Navigate down to "Cache Management" (second item) and wait
    stdin.write("j");
    await new Promise((r) => setTimeout(r, 50));

    // Select Cache Management
    stdin.write("\r");

    // Wait for cache list to load
    await vi.waitFor(
      () => {
        const frame = lastFrame();
        expect(frame).toContain("http-cache");
      },
      { timeout: 3000 },
    );

    const frame = lastFrame();
    expect(frame).toContain("http-cache");
    expect(frame).toContain("global-packages");
  });
});
