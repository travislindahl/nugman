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
import * as localSource from "../../services/local-source.js";
import { strings } from "../../lib/strings.js";
import { colors } from "../../lib/theme.js";
import { formatBytes } from "../../lib/format.js";

const HINTS = [
  { key: "\u2191\u2193/jk", label: "Navigate" },
  { key: "a", label: "Add" },
  { key: "Space", label: "Select" },
  { key: "d", label: "Remove" },
  { key: "i", label: "Inspect" },
  { key: "Esc", label: "Back" },
];

export function PackageList(): React.ReactNode {
  const { navigate, goBack } = useNavigation();
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const loadPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const packages = await localSource.listPackages();
      dispatch({ type: "SET_LOCAL_PACKAGES", packages });
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.errors.generic);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    void loadPackages();
  }, [loadPackages]);

  useInput(
    (input, key) => {
      if (confirmRemove) return;

      if (input === "a") {
        navigate({ kind: "local-source-add" });
      } else if (input === " ") {
        const pkg = state.localPackages[selectedIndex];
        if (pkg) {
          setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(pkg.filePath)) {
              next.delete(pkg.filePath);
            } else {
              next.add(pkg.filePath);
            }
            return next;
          });
        }
      } else if (input === "d" && selected.size > 0) {
        setConfirmRemove(true);
      } else if (input === "i") {
        const pkg = state.localPackages[selectedIndex];
        if (pkg) {
          navigate({ kind: "package-detail", packagePath: pkg.filePath });
        }
      } else if (key.escape) {
        goBack();
      }
    },
    { isActive: !confirmRemove },
  );

  const handleRemove = useCallback(async () => {
    try {
      await localSource.removePackages([...selected]);
      setSelected(new Set());
      setConfirmRemove(false);
      await loadPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.errors.generic);
      setConfirmRemove(false);
    }
  }, [selected, loadPackages]);

  if (loading) return <Loading message="Loading packages..." />;
  if (error) return <ErrorDisplay message={error} onRetry={loadPackages} />;

  const items: ListViewItem[] = state.localPackages.map((pkg) => ({
    key: pkg.filePath,
    label: `${selected.has(pkg.filePath) ? "[x] " : "[ ] "}${pkg.id} ${pkg.version}`,
    description: formatBytes(pkg.fileSizeBytes),
  }));

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={colors.primary}>
        {strings.localSource.title}
      </Text>
      {confirmRemove ? (
        <ConfirmDialog
          message={`${strings.localSource.confirmRemove} (${selected.size} package(s))`}
          onConfirm={() => void handleRemove()}
          onCancel={() => setConfirmRemove(false)}
        />
      ) : items.length === 0 ? (
        <EmptyState
          message={strings.localSource.empty}
          guidance={strings.localSource.emptyGuidance}
        />
      ) : (
        <Box marginY={1}>
          <ListView
            items={items}
            onSelect={(_item) => {
              const idx = items.findIndex((i) => i.key === _item.key);
              setSelectedIndex(idx);
            }}
            onBack={goBack}
            isActive={!confirmRemove}
          />
        </Box>
      )}
      {selected.size > 0 && <Text dimColor>{selected.size} package(s) selected</Text>}
      <StatusBar hints={HINTS} />
    </Box>
  );
}
