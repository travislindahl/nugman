import { useState, useEffect, useCallback, useRef } from "react";
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
  readonly onHighlight?: (item: ListViewItem, index: number) => void;
  readonly onBack?: () => void;
  readonly isActive?: boolean;
  readonly initialIndex?: number;
}

export function ListView({
  items,
  onSelect,
  onHighlight,
  onBack,
  isActive = true,
  initialIndex,
}: ListViewProps): React.ReactNode {
  const [selectedIndex, setSelectedIndex] = useState(() =>
    initialIndex != null ? Math.max(0, Math.min(initialIndex, items.length - 1)) : 0,
  );
  const onHighlightRef = useRef(onHighlight);
  onHighlightRef.current = onHighlight;
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (selectedIndex !== 0) {
        const item = itemsRef.current[selectedIndex];
        if (item && onHighlightRef.current) onHighlightRef.current(item, selectedIndex);
      }
      return;
    }
    const item = itemsRef.current[selectedIndex];
    if (item && onHighlightRef.current) onHighlightRef.current(item, selectedIndex);
  }, [selectedIndex]);

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
