import { useState, useEffect, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { useNavigation } from "../../hooks/use-navigation.js";
import { useAppState } from "../../state/app-context.js";
import { ListView } from "../shared/list-view.js";
import type { ListViewItem } from "../shared/list-view.js";
import { StatusBar } from "../shared/status-bar.js";
import { EmptyState } from "../shared/empty-state.js";
import { Loading } from "../shared/loading.js";
import { ErrorDisplay } from "../shared/error-display.js";
import * as cacheService from "../../services/nuget-cache.js";
import { colors } from "../../lib/theme.js";
import { formatBytes } from "../../lib/format.js";
import type { CacheType, CacheEntry } from "../../types.js";

const HINTS = [
  { key: "\u2191\u2193/jk", label: "Navigate" },
  { key: "i", label: "Inspect" },
  { key: "Esc", label: "Back" },
];

interface CacheBrowseProps {
  readonly cacheType: CacheType;
}

export function CacheBrowse({ cacheType }: CacheBrowseProps): React.ReactNode {
  const { navigate, goBack } = useNavigation();
  const state = useAppState();
  const [selectedEntry, setSelectedEntry] = useState<CacheEntry | null>(null);
  const location = state.cacheLocations.find((l) => l.type === cacheType);
  const [entries, setEntries] = useState<readonly CacheEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContents = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    try {
      const contents = await cacheService.listCacheContents(location.path);
      setEntries(contents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cache contents");
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    void loadContents();
  }, [loadContents]);

  useInput((input, _key) => {
    if (input === "i" && selectedEntry && selectedEntry.name.endsWith(".nupkg")) {
      navigate({ kind: "package-detail", packagePath: selectedEntry.path });
    }
  });

  if (loading) return <Loading message="Loading cache contents..." />;
  if (error) return <ErrorDisplay message={error} onRetry={loadContents} />;

  const items: ListViewItem[] = entries.map((entry) => ({
    key: entry.path,
    label: entry.name,
    description: entry.isDirectory ? "directory" : formatBytes(entry.sizeBytes),
    badge: entry.isDirectory ? "DIR" : undefined,
  }));

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={colors.primary}>
        Cache: {cacheType}
      </Text>
      {location && <Text dimColor>{location.path}</Text>}
      {items.length === 0 ? (
        <EmptyState message="Cache is empty" />
      ) : (
        <Box marginY={1}>
          <ListView
            items={items}
            onSelect={(item) => {
              const entry = entries.find((e) => e.path === item.key);
              if (entry) setSelectedEntry(entry);
            }}
            onHighlight={(_item, index) => {
              const entry = entries[index];
              if (entry) setSelectedEntry(entry);
            }}
            onBack={goBack}
          />
        </Box>
      )}
      <StatusBar hints={HINTS} />
    </Box>
  );
}
