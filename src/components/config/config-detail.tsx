import { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { useNavigation } from "../../hooks/use-navigation.js";
import * as configService from "../../services/nuget-config.js";
import { StatusBar } from "../shared/status-bar.js";
import { Loading } from "../shared/loading.js";
import { ErrorDisplay } from "../shared/error-display.js";
import { colors } from "../../lib/theme.js";
import type { NuGetConfigContents } from "../../types.js";

interface ConfigDetailProps {
  readonly filePath: string;
}

const HINTS = [{ key: "Esc", label: "Back" }];

export function ConfigDetail({ filePath }: ConfigDetailProps): React.ReactNode {
  const { goBack } = useNavigation();
  const [contents, setContents] = useState<NuGetConfigContents | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await configService.readConfigFile(filePath);
        if (!cancelled) setContents(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to read config");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [filePath]);

  useInput((_input, key) => {
    if (key.escape) goBack();
  });

  if (loading) return <Loading message="Reading config file..." />;
  if (error) return <ErrorDisplay message={error} />;
  if (!contents) return <ErrorDisplay message="No contents found" />;

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={colors.primary}>
        {filePath}
      </Text>
      <Box marginY={1} flexDirection="column">
        {contents.sources.length > 0 && (
          <>
            <Text bold>Package Sources:</Text>
            {contents.sources.map((s) => (
              <Text key={s.name}>
                {"  "}
                {s.name}: {s.value}
              </Text>
            ))}
          </>
        )}
        {contents.disabledSources.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            <Text bold>Disabled Sources:</Text>
            {contents.disabledSources.map((s) => (
              <Text key={s} dimColor>
                {"  "}
                {s}
              </Text>
            ))}
          </Box>
        )}
        {contents.packageSourceMappings.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            <Text bold>Package Source Mappings:</Text>
            {contents.packageSourceMappings.map((m) => (
              <Box key={m.sourceKey} flexDirection="column">
                <Text>
                  {"  "}
                  {m.sourceKey}:
                </Text>
                {m.patterns.map((p) => (
                  <Text key={p} dimColor>
                    {"    "}- {p}
                  </Text>
                ))}
              </Box>
            ))}
          </Box>
        )}
      </Box>
      <StatusBar hints={HINTS} />
    </Box>
  );
}
