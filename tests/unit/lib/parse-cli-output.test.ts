import { describe, it, expect } from "vitest";
import { parseSourceList, parseCacheLocals } from "@/lib/parse-cli-output.js";

describe("[Unit] parseSourceList", () => {
  it("SHOULD parse sources from detailed format output", () => {
    const output = `Registered Sources:
  1.  nuget.org [Enabled]
      https://api.nuget.org/v3/index.json
  2.  MyPrivate [Disabled]
      https://myserver/nuget/v3/index.json
`;
    const sources = parseSourceList(output);
    expect(sources).toHaveLength(2);
    expect(sources[0]).toEqual({
      name: "nuget.org",
      url: "https://api.nuget.org/v3/index.json",
      enabled: true,
      configLevel: "user",
      isManaged: false,
    });
    expect(sources[1]).toEqual({
      name: "MyPrivate",
      url: "https://myserver/nuget/v3/index.json",
      enabled: false,
      configLevel: "user",
      isManaged: false,
    });
  });

  it("SHOULD return empty array WHEN output has no sources", () => {
    const output = "Registered Sources:\n";
    expect(parseSourceList(output)).toHaveLength(0);
  });

  it("SHOULD handle empty string input", () => {
    expect(parseSourceList("")).toHaveLength(0);
  });
});

describe("[Unit] parseCacheLocals", () => {
  it("SHOULD parse cache locations from dotnet nuget locals output", () => {
    const output = `info : http-cache: /home/user/.local/share/NuGet/v3-cache
info : global-packages: /home/user/.nuget/packages/
info : temp: /tmp/NuGetScratch
info : plugins-cache: /home/user/.local/share/NuGet/plugins-cache
`;
    const locations = parseCacheLocals(output);
    expect(locations).toHaveLength(4);
    expect(locations[0]).toEqual({
      type: "http-cache",
      path: "/home/user/.local/share/NuGet/v3-cache",
      diskUsageBytes: 0,
    });
    expect(locations[1]).toEqual({
      type: "global-packages",
      path: "/home/user/.nuget/packages/",
      diskUsageBytes: 0,
    });
  });

  it("SHOULD handle output without info prefix", () => {
    const output = `http-cache: /some/path
global-packages: /other/path
`;
    const locations = parseCacheLocals(output);
    expect(locations).toHaveLength(2);
    expect(locations[0]!.type).toBe("http-cache");
    expect(locations[0]!.path).toBe("/some/path");
  });

  it("SHOULD return empty array for empty input", () => {
    expect(parseCacheLocals("")).toHaveLength(0);
  });
});
