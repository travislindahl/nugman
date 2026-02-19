import { useState, useEffect, useCallback, useRef } from "react";
import { Box, Text, useInput } from "ink";
import { useNavigation } from "../../hooks/use-navigation.js";
import { useAppState, useAppDispatch } from "../../state/app-context.js";
import { ListView } from "../shared/list-view.js";
import type { ListViewItem } from "../shared/list-view.js";
import { StatusBar } from "../shared/status-bar.js";
import { ConfirmDialog } from "../shared/confirm-dialog.js";
import { Loading } from "../shared/loading.js";
import { ErrorDisplay } from "../shared/error-display.js";
import * as cacheService from "../../services/nuget-cache.js";
import { strings } from "../../lib/strings.js";
import { colors } from "../../lib/theme.js";
import { formatBytes } from "../../lib/format.js";
import type { CacheType } from "../../types.js";

const HINTS = [
  { key: "\u2191\u2193/jk", label: "Navigate" },
  { key: "Enter", label: "Browse" },
  { key: "c", label: "Clear" },
  { key: "C", label: "Clear All" },
  { key: "Esc", label: "Back" },
];

export function CacheList(): React.ReactNode {
  const { navigate, goBack } = useNavigation();
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState<CacheType | "all" | null>(null);
  const selectedIndexRef = useRef(0);

  const loadCaches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const locations = await cacheService.listCacheLocations();
      dispatch({ type: "SET_CACHE_LOCATIONS", locations });
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.errors.generic);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    void loadCaches();
  }, [loadCaches]);

  useInput(
    (input, key) => {
      if (confirmClear) return;

      if (input === "c" && state.cacheLocations[selectedIndexRef.current]) {
        setConfirmClear(state.cacheLocations[selectedIndexRef.current]!.type);
      } else if (input === "C") {
        setConfirmClear("all");
      } else if (key.escape) {
        goBack();
      }
    },
    { isActive: !confirmClear },
  );

  const handleClear = useCallback(async () => {
    if (!confirmClear) return;
    try {
      if (confirmClear === "all") {
        await cacheService.clearAllCaches();
      } else {
        await cacheService.clearCache(confirmClear);
      }
      setConfirmClear(null);
      await loadCaches();
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.errors.generic);
      setConfirmClear(null);
    }
  }, [confirmClear, loadCaches]);

  if (loading) return <Loading message="Loading cache locations..." />;
  if (error) return <ErrorDisplay message={error} onRetry={loadCaches} />;

  const items: ListViewItem[] = state.cacheLocations.map((loc) => ({
    key: loc.type,
    label: loc.type,
    description: formatBytes(loc.diskUsageBytes),
    badge: loc.path,
  }));

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={colors.primary}>
        {strings.cache.title}
      </Text>
      {confirmClear ? (
        <ConfirmDialog
          message={
            confirmClear === "all" ? strings.cache.confirmClearAll : strings.cache.confirmClear
          }
          onConfirm={() => void handleClear()}
          onCancel={() => setConfirmClear(null)}
        />
      ) : (
        <Box marginY={1}>
          <ListView
            items={items}
            onSelect={(item) => {
              navigate({ kind: "cache-browse", cacheType: item.key as CacheType });
            }}
            onBack={goBack}
            isActive={!confirmClear}
          />
        </Box>
      )}
      <StatusBar hints={HINTS} />
    </Box>
  );
}
