import { useState, useEffect, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { useNavigation } from "../../hooks/use-navigation.js";
import { useAppState, useAppDispatch } from "../../state/app-context.js";
import { ListView } from "../shared/list-view.js";
import type { ListViewItem } from "../shared/list-view.js";
import { StatusBar } from "../shared/status-bar.js";
import { ConfirmDialog } from "../shared/confirm-dialog.js";
import { EmptyState } from "../shared/empty-state.js";
import { Loading } from "../shared/loading.js";
import { ErrorDisplay } from "../shared/error-display.js";
import * as sourceService from "../../services/nuget-source.js";
import { strings } from "../../lib/strings.js";
import { colors } from "../../lib/theme.js";
import type { NuGetSource, SourceHealthResult } from "../../types.js";

const HINTS = [
  { key: "\u2191\u2193/jk", label: "Navigate" },
  { key: "a", label: "Add" },
  { key: "e", label: "Edit" },
  { key: "d", label: "Delete" },
  { key: "t", label: "Toggle" },
  { key: "h", label: "Health" },
  { key: "Esc", label: "Back" },
];

export function SourceList(): React.ReactNode {
  const { navigate, goBack } = useNavigation();
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<NuGetSource | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [healthResults, setHealthResults] = useState<ReadonlyMap<string, SourceHealthResult>>(
    new Map(),
  );
  const [checkingHealth, setCheckingHealth] = useState(false);

  const loadSources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sources = await sourceService.listSources();
      dispatch({ type: "SET_SOURCES", sources });
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.errors.generic);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    void loadSources();
  }, [loadSources]);

  const selectedSource = state.sources[selectedIndex];

  useInput(
    (input, key) => {
      if (confirmDelete) return;

      if (input === "a") {
        navigate({ kind: "source-add" });
      } else if (input === "e" && selectedSource && selectedSource.configLevel === "user") {
        navigate({ kind: "source-edit", sourceName: selectedSource.name });
      } else if (
        input === "d" &&
        selectedSource &&
        !selectedSource.isManaged &&
        selectedSource.configLevel === "user"
      ) {
        setConfirmDelete(selectedSource);
      } else if (input === "h" && !checkingHealth) {
        setCheckingHealth(true);
        void sourceService.checkAllHealth(state.sources).then((results) => {
          const map = new Map<string, SourceHealthResult>();
          for (const r of results) map.set(r.sourceName, r);
          setHealthResults(map);
          setCheckingHealth(false);
        });
      } else if (input === "t" && selectedSource) {
        void (
          selectedSource.enabled
            ? sourceService.disableSource(selectedSource.name)
            : sourceService.enableSource(selectedSource.name)
        ).then(() => loadSources());
      } else if (key.escape) {
        goBack();
      }
    },
    { isActive: !confirmDelete },
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!confirmDelete) return;
    try {
      await sourceService.removeSource(confirmDelete.name);
      setConfirmDelete(null);
      await loadSources();
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.errors.generic);
      setConfirmDelete(null);
    }
  }, [confirmDelete, loadSources]);

  if (loading) return <Loading message="Loading sources..." />;
  if (error) return <ErrorDisplay message={error} onRetry={loadSources} />;

  const items: ListViewItem[] = state.sources.map((s) => {
    const health = healthResults.get(s.name);
    const statusBadge = s.isManaged
      ? strings.sources.managed
      : s.enabled
        ? strings.sources.enabled
        : strings.sources.disabled;
    const healthBadge = checkingHealth
      ? " [checking...]"
      : health?.status === "healthy"
        ? ` [healthy ${health.responseTimeMs}ms]`
        : health?.status === "unhealthy"
          ? ` [unhealthy: ${health.error}]`
          : "";
    const badgeColor =
      health?.status === "unhealthy"
        ? colors.error
        : health?.status === "healthy"
          ? colors.success
          : s.isManaged
            ? colors.secondary
            : s.enabled
              ? colors.success
              : colors.muted;
    return {
      key: s.name,
      label: s.name,
      description: s.url,
      badge: statusBadge + healthBadge,
      badgeColor,
    };
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={colors.primary}>
        {strings.sources.title}
      </Text>
      {confirmDelete ? (
        <ConfirmDialog
          message={`${strings.sources.confirmDelete} (${confirmDelete.name})`}
          onConfirm={() => void handleDeleteConfirm()}
          onCancel={() => setConfirmDelete(null)}
        />
      ) : items.length === 0 ? (
        <EmptyState message={strings.sources.empty} guidance={strings.sources.emptyGuidance} />
      ) : (
        <Box marginY={1}>
          <ListView
            items={items}
            onSelect={(item) => {
              const idx = items.indexOf(item);
              setSelectedIndex(idx);
            }}
            onHighlight={(_item, index) => {
              setSelectedIndex(index);
            }}
            onBack={goBack}
            isActive={!confirmDelete}
          />
        </Box>
      )}
      <StatusBar hints={HINTS} />
    </Box>
  );
}
