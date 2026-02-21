import { useState, useEffect, useCallback, useRef } from "react";
import { Box, Text } from "ink";
import { useNavigation } from "../../hooks/use-navigation.js";
import { ListView } from "../shared/list-view.js";
import type { ListViewItem } from "../shared/list-view.js";
import { StatusBar } from "../shared/status-bar.js";
import { EmptyState } from "../shared/empty-state.js";
import { Loading } from "../shared/loading.js";
import { ErrorDisplay } from "../shared/error-display.js";
import * as configService from "../../services/nuget-config.js";
import { strings } from "../../lib/strings.js";
import { colors } from "../../lib/theme.js";
import type { NuGetConfigFile } from "../../types.js";

const HINTS = [
  { key: "\u2191\u2193/jk", label: "Navigate" },
  { key: "Enter", label: "View" },
  { key: "Esc", label: "Back" },
];

interface ConfigListProps {
  readonly initialIndex?: number;
}

export function ConfigList({ initialIndex }: ConfigListProps): React.ReactNode {
  const { navigate, goBack } = useNavigation();
  const [files, setFiles] = useState<readonly NuGetConfigFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selectedIndexRef = useRef(initialIndex ?? 0);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const result = await configService.listConfigFiles();
      setFiles(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.errors.generic);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  if (loading) return <Loading message="Discovering config files..." />;
  if (error) return <ErrorDisplay message={error} onRetry={loadFiles} />;

  const items: ListViewItem[] = files.map((f) => ({
    key: f.path,
    label: f.path,
    badge: f.level,
    badgeColor: f.readable ? colors.success : colors.error,
    description: f.readable ? undefined : f.error,
  }));

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={colors.primary}>
        {strings.config.title}
      </Text>
      {items.length === 0 ? (
        <EmptyState message={strings.config.empty} />
      ) : (
        <Box marginY={1}>
          <ListView
            items={items}
            onSelect={(item) =>
              navigate({ kind: "config-file-detail", filePath: item.key }, selectedIndexRef.current)
            }
            onHighlight={(_item, index) => {
              selectedIndexRef.current = index;
            }}
            onBack={goBack}
            initialIndex={initialIndex}
          />
        </Box>
      )}
      <StatusBar hints={HINTS} />
    </Box>
  );
}
