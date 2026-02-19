import { Box, Text } from "ink";

interface EmptyStateProps {
  readonly message: string;
  readonly guidance?: string;
}

export function EmptyState({ message, guidance }: EmptyStateProps): React.ReactNode {
  return (
    <Box flexDirection="column" paddingY={1}>
      <Text dimColor>{message}</Text>
      {guidance && <Text dimColor>{guidance}</Text>}
    </Box>
  );
}
