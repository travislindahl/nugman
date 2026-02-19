import { Box, Text, useApp } from "ink";
import { useNavigation } from "../hooks/use-navigation.js";
import { ListView } from "./shared/list-view.js";
import type { ListViewItem } from "./shared/list-view.js";
import { StatusBar } from "./shared/status-bar.js";
import { strings } from "../lib/strings.js";
import { colors } from "../lib/theme.js";
import { useInput } from "ink";

const MENU_ITEMS: readonly ListViewItem[] = [
  { key: "sources", label: strings.menu.sources },
  { key: "cache", label: strings.menu.cache },
  { key: "local-source", label: strings.menu.localSource },
  { key: "package-search", label: strings.menu.packageSearch },
  { key: "config-viewer", label: strings.menu.configViewer },
];

const HINTS = [
  { key: strings.hints.navigate.split(" ")[0]!, label: "Navigate" },
  { key: "Enter", label: "Select" },
  { key: "q", label: "Quit" },
];

export function MainMenu(): React.ReactNode {
  const { navigate } = useNavigation();
  const { exit } = useApp();

  useInput((input) => {
    if (input === "q") exit();
  });

  function handleSelect(item: ListViewItem) {
    switch (item.key) {
      case "sources":
        navigate({ kind: "sources" });
        break;
      case "cache":
        navigate({ kind: "cache" });
        break;
      case "local-source":
        navigate({ kind: "local-source" });
        break;
      case "package-search":
        navigate({ kind: "package-search" });
        break;
      case "config-viewer":
        navigate({ kind: "config-viewer" });
        break;
    }
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={colors.primary}>
        {strings.app.title}
      </Text>
      <Box marginY={1}>
        <ListView items={MENU_ITEMS} onSelect={handleSelect} />
      </Box>
      <StatusBar hints={HINTS} />
    </Box>
  );
}
