import { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { colors } from "../../lib/theme.js";

export interface ListViewItem {
  readonly key: string;
  readonly label: string;
  readonly description?: string;
  readonly badge?: string;
  readonly badgeColor?: string;
}

interface ListViewProps {
  readonly items: readonly ListViewItem[];
  readonly onSelect: (item: ListViewItem) => void;
  readonly onBack?: () => void;
  readonly isActive?: boolean;
}

export function ListView({
  items,
  onSelect,
  onBack,
  isActive = true,
}: ListViewProps): React.ReactNode {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const clampIndex = useCallback(
    (index: number) => Math.max(0, Math.min(index, items.length - 1)),
    [items.length],
  );

  useInput(
    (input, key) => {
      if (!isActive || items.length === 0) return;

      if (key.upArrow || input === "k") {
        setSelectedIndex((prev) => clampIndex(prev - 1));
      } else if (key.downArrow || input === "j") {
        setSelectedIndex((prev) => clampIndex(prev + 1));
      } else if (key.return) {
        const item = items[selectedIndex];
        if (item) onSelect(item);
      } else if (key.escape && onBack) {
        onBack();
      }
    },
    { isActive },
  );

  return (
    <Box flexDirection="column">
      {items.map((item, index) => {
        const isSelected = index === selectedIndex;
        return (
          <Box key={item.key}>
            <Text color={isSelected ? colors.primary : undefined} bold={isSelected}>
              {isSelected ? "> " : "  "}
              {item.label}
            </Text>
            {item.badge && <Text color={item.badgeColor ?? colors.muted}> [{item.badge}]</Text>}
            {item.description && <Text dimColor> - {item.description}</Text>}
          </Box>
        );
      })}
    </Box>
  );
}
