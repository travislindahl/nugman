import { useState, useEffect } from "react";
import { Box, Text, useStdout } from "ink";
import { AppProvider, useAppState } from "./state/app-context.js";
import { useDotnet } from "./hooks/use-dotnet.js";
import * as localSource from "./services/local-source.js";
import { MainMenu } from "./components/main-menu.js";
import { SourceList } from "./components/sources/source-list.js";
import { SourceEdit } from "./components/sources/source-edit.js";
import { SourceAdd } from "./components/sources/source-add.js";
import { CacheList } from "./components/cache/cache-list.js";
import { CacheBrowse } from "./components/cache/cache-browse.js";
import { PackageList } from "./components/local-source/package-list.js";
import { AddPackage } from "./components/local-source/add-package.js";
import { PackageDetail } from "./components/package-detail.js";
import { SearchView } from "./components/search/search-view.js";
import { SearchDetail } from "./components/search/search-detail.js";
import { ConfigList } from "./components/config/config-list.js";
import { ConfigDetail } from "./components/config/config-detail.js";
import { strings } from "./lib/strings.js";
import { colors } from "./lib/theme.js";

const MIN_COLS = 80;
const MIN_ROWS = 24;

function AppContent(): React.ReactNode {
  const { checking, available, error } = useDotnet();
  const state = useAppState();
  const [initializing, setInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const { stdout } = useStdout();

  useEffect(() => {
    if (!available || checking) return;
    let cancelled = false;
    setInitializing(true);
    localSource
      .initialize()
      .catch((err: unknown) => {
        if (!cancelled) {
          setInitError(err instanceof Error ? err.message : "Failed to initialize local source");
        }
      })
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [available, checking]);

  const cols = stdout?.columns ?? MIN_COLS;
  const rows = stdout?.rows ?? MIN_ROWS;
  if (cols < MIN_COLS || rows < MIN_ROWS) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color={colors.primary}>
          {strings.app.title}
        </Text>
        <Text color={colors.warning}>
          Terminal too small ({cols}x{rows}). Minimum size is {MIN_COLS}x{MIN_ROWS}.
        </Text>
        <Text dimColor>Please resize your terminal window.</Text>
      </Box>
    );
  }

  if (checking) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color={colors.primary}>
          {strings.app.title}
        </Text>
        <Text dimColor>{strings.status.checking}</Text>
      </Box>
    );
  }

  if (!available) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color={colors.primary}>
          {strings.app.title}
        </Text>
        <Text color={colors.error}>{error ?? strings.errors.dotnetNotFound}</Text>
        <Box marginTop={1} flexDirection="column">
          <Text dimColor>To install the .NET SDK:</Text>
          <Text dimColor> https://dotnet.microsoft.com/download</Text>
          <Text dimColor>
            After installing, ensure {"'"}dotnet{"'"} is on your PATH and restart your terminal.
          </Text>
        </Box>
      </Box>
    );
  }

  if (initializing) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color={colors.primary}>
          {strings.app.title}
        </Text>
        <Text dimColor>{strings.status.initializing}</Text>
      </Box>
    );
  }

  if (initError) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color={colors.primary}>
          {strings.app.title}
        </Text>
        <Text color={colors.warning}>Warning: {initError}</Text>
        <Text dimColor>Continuing without local source...</Text>
      </Box>
    );
  }

  switch (state.currentView.kind) {
    case "main-menu":
      return <MainMenu />;
    case "sources":
      return <SourceList />;
    case "source-edit":
      return <SourceEdit sourceName={state.currentView.sourceName} />;
    case "source-add":
      return <SourceAdd />;
    case "cache":
      return <CacheList />;
    case "cache-browse":
      return <CacheBrowse cacheType={state.currentView.cacheType} />;
    case "local-source":
      return <PackageList />;
    case "local-source-add":
      return <AddPackage />;
    case "package-detail":
      return <PackageDetail packagePath={state.currentView.packagePath} />;
    case "package-search":
      return <SearchView />;
    case "search-result-detail":
      return (
        <SearchDetail
          packageId={state.currentView.packageId}
          sourceName={state.currentView.sourceName}
          latestVersion={state.currentView.latestVersion}
          totalDownloads={state.currentView.totalDownloads}
          owners={state.currentView.owners}
        />
      );
    case "config-viewer":
      return <ConfigList />;
    case "config-file-detail":
      return <ConfigDetail filePath={state.currentView.filePath} />;
  }
}

export function App(): React.ReactNode {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
