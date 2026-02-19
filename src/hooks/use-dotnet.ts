import { useState, useEffect } from "react";
import { checkAvailability } from "../services/dotnet-cli.js";
import type { DotnetInfo } from "../types.js";

export function useDotnet() {
  const [info, setInfo] = useState<DotnetInfo>({ available: false });
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const result = await checkAvailability();
      if (!cancelled) {
        setInfo(result);
        setChecking(false);
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  return { ...info, checking };
}
