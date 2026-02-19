import { Box, Text, useInput } from "ink";
import { ConfirmInput } from "@inkjs/ui";
import { colors } from "../../lib/theme.js";

interface ConfirmDialogProps {
  readonly message: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps): React.ReactNode {
  useInput((_input, key) => {
    if (key.escape) onCancel();
  });

  return (
    <Box flexDirection="column">
      <Text color={colors.warning}>{message}</Text>
      <ConfirmInput onConfirm={onConfirm} onCancel={onCancel} />
    </Box>
  );
}
