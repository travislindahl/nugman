import { Box, Text, useInput } from "ink";
import { useNavigation } from "../../hooks/use-navigation.js";
import { StatusBar } from "../shared/status-bar.js";
import { colors } from "../../lib/theme.js";

interface SearchDetailProps {
  readonly packageId: string;
  readonly sourceName: string;
  readonly latestVersion: string;
  readonly totalDownloads?: number;
  readonly owners?: string;
}

const HINTS = [{ key: "Esc", label: "Back" }];

function formatDownloads(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function SearchDetail({
  packageId,
  sourceName,
  latestVersion,
  totalDownloads,
  owners,
}: SearchDetailProps): React.ReactNode {
  const { goBack } = useNavigation();

  useInput((_input, key) => {
    if (key.escape) goBack();
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={colors.primary}>
        {packageId}
      </Text>
      <Box marginY={1} flexDirection="column">
        <Text>
          <Text bold>Version: </Text>
          {latestVersion}
        </Text>
        <Text>
          <Text bold>Source: </Text>
          {sourceName}
        </Text>
        {owners && (
          <Text>
            <Text bold>Owners: </Text>
            {owners}
          </Text>
        )}
        {totalDownloads !== undefined && (
          <Text>
            <Text bold>Downloads: </Text>
            {formatDownloads(totalDownloads)}
          </Text>
        )}
        <Box marginTop={1}>
          <Text dimColor>Package details are read-only.</Text>
        </Box>
      </Box>
      <StatusBar hints={HINTS} />
    </Box>
  );
}
