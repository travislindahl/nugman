import { Box, Text } from "ink";
import { colors } from "../../lib/theme.js";

export interface StatusBarHint {
  readonly key: string;
  readonly label: string;
}

interface StatusBarProps {
  readonly hints: readonly StatusBarHint[];
}

export function StatusBar({ hints }: StatusBarProps): React.ReactNode {
  return (
    <Box borderStyle="single" borderColor={colors.muted} paddingX={1}>
      {hints.map((hint, i) => (
        <Box key={hint.key} marginRight={i < hints.length - 1 ? 2 : 0}>
          <Text bold color={colors.primary}>
            {hint.key}
          </Text>
          <Text dimColor> {hint.label}</Text>
        </Box>
      ))}
    </Box>
  );
}
