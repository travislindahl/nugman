import { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { useNavigation } from "../hooks/use-navigation.js";
import * as metadataService from "../services/package-metadata.js";
import { StatusBar } from "./shared/status-bar.js";
import { Loading } from "./shared/loading.js";
import { ErrorDisplay } from "./shared/error-display.js";
import { colors } from "../lib/theme.js";
import type { PackageMetadata } from "../types.js";

interface PackageDetailProps {
  readonly packagePath: string;
}

const HINTS = [{ key: "Esc", label: "Back" }];

export function PackageDetail({ packagePath }: PackageDetailProps): React.ReactNode {
  const { goBack } = useNavigation();
  const [metadata, setMetadata] = useState<PackageMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await metadataService.readMetadata(packagePath);
      if (cancelled) return;
      if (result.kind === "success") {
        setMetadata(result.metadata);
      } else {
        setError(result.message);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [packagePath]);

  useInput((_input, key) => {
    if (key.escape) goBack();
  });

  if (loading) return <Loading message="Reading package metadata..." />;
  if (error) return <ErrorDisplay message={error} />;
  if (!metadata) return <ErrorDisplay message="No metadata found" />;

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={colors.primary}>
        {metadata.id} v{metadata.version}
      </Text>
      <Box marginY={1} flexDirection="column">
        <Text>Authors: {metadata.authors}</Text>
        <Text>Description: {metadata.description}</Text>
        {metadata.title && <Text>Title: {metadata.title}</Text>}
        {metadata.license && (
          <Text>
            License: {metadata.license.value} ({metadata.license.type})
          </Text>
        )}
        {metadata.projectUrl && <Text>Project URL: {metadata.projectUrl}</Text>}
        {metadata.copyright && <Text>Copyright: {metadata.copyright}</Text>}
        {metadata.tags.length > 0 && <Text>Tags: {metadata.tags.join(", ")}</Text>}
        {metadata.targetFrameworks.length > 0 && (
          <Text>Frameworks: {metadata.targetFrameworks.join(", ")}</Text>
        )}
        {metadata.dependencies.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            <Text bold>Dependencies:</Text>
            {metadata.dependencies.map((group, gi) => (
              <Box key={gi} flexDirection="column" marginLeft={2}>
                {group.targetFramework && (
                  <Text color={colors.secondary}>{group.targetFramework}:</Text>
                )}
                {group.dependencies.map((dep) => (
                  <Text key={dep.id} dimColor>
                    {dep.id} {dep.versionRange}
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
