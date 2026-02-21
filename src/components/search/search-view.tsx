import { useState, useCallback, useRef } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput } from "@inkjs/ui";
import { useNavigation } from "../../hooks/use-navigation.js";
import * as searchService from "../../services/package-search.js";
import { ListView } from "../shared/list-view.js";
import type { ListViewItem } from "../shared/list-view.js";
import { StatusBar } from "../shared/status-bar.js";
import { EmptyState } from "../shared/empty-state.js";
import { Loading } from "../shared/loading.js";
import { ErrorDisplay } from "../shared/error-display.js";
import { strings } from "../../lib/strings.js";
import { colors } from "../../lib/theme.js";
import type { PackageSearchResult } from "../../types.js";

const HINTS = [
  { key: "\u2191\u2193/jk", label: "Navigate" },
  { key: "Enter", label: "Details" },
  { key: "Esc", label: "Back" },
];

interface SearchViewProps {
  readonly initialIndex?: number;
}

export function SearchView({ initialIndex }: SearchViewProps): React.ReactNode {
  const { navigate, goBack } = useNavigation();
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<readonly PackageSearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedIndexRef = useRef(initialIndex ?? 0);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim() || searching) return;
    setSearching(true);
    setError(null);
    try {
      const data = await searchService.search(searchTerm.trim());
      setResults(data);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.errors.generic);
    } finally {
      setSearching(false);
    }
  }, [searchTerm, searching]);

  useInput((_input, key) => {
    if (key.escape) goBack();
  });

  const allPackages = results.flatMap((r) =>
    r.packages.map((p) => ({ ...p, sourceName: r.sourceName })),
  );

  const items: ListViewItem[] = allPackages.map((p) => ({
    key: `${p.sourceName}:${p.id}`,
    label: p.id,
    description: `v${p.latestVersion}`,
    badge: p.sourceName,
    badgeColor: colors.muted,
  }));

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={colors.primary}>
        {strings.search.title}
      </Text>
      <Box marginY={1}>
        <Text>Search: </Text>
        <TextInput
          placeholder={strings.search.placeholder}
          onChange={setSearchTerm}
          onSubmit={() => void handleSearch()}
        />
      </Box>
      {error && <ErrorDisplay message={error} />}
      {searching ? (
        <Loading message={strings.search.searching} />
      ) : searched && items.length === 0 ? (
        <EmptyState message={strings.search.noResults} />
      ) : items.length > 0 ? (
        <ListView
          items={items}
          onSelect={(item) => {
            const pkg = allPackages.find((p) => `${p.sourceName}:${p.id}` === item.key);
            if (pkg) {
              navigate(
                {
                  kind: "search-result-detail",
                  packageId: pkg.id,
                  sourceName: pkg.sourceName,
                  latestVersion: pkg.latestVersion,
                  totalDownloads: pkg.totalDownloads,
                  owners: pkg.owners,
                },
                selectedIndexRef.current,
              );
            }
          }}
          onHighlight={(_item, index) => {
            selectedIndexRef.current = index;
          }}
          initialIndex={initialIndex}
        />
      ) : null}
      <StatusBar hints={HINTS} />
    </Box>
  );
}
