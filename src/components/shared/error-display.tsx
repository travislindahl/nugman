import { Box, Text } from "ink";
import { colors } from "../../lib/theme.js";

interface ErrorDisplayProps {
  readonly message: string;
  readonly onRetry?: () => void;
}

function getGuidance(message: string): string | null {
  const lower = message.toLowerCase();
  if (lower.includes("eacces") || lower.includes("permission denied")) {
    return process.platform === "win32"
      ? "Try running as Administrator, or check folder permissions."
      : "Try running with sudo, or check folder permissions (chmod/chown).";
  }
  if (lower.includes("enoent") || lower.includes("not found")) {
    return "The file or directory does not exist. Check the path and try again.";
  }
  if (lower.includes("corrupted") || lower.includes("invalid zip") || lower.includes("bad nupkg")) {
    return "The .nupkg file may be corrupted. Try re-downloading or re-building it.";
  }
  if (lower.includes("nuspec")) {
    return "The package may be malformed. Ensure it contains a valid .nuspec file.";
  }
  return null;
}

export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps): React.ReactNode {
  const guidance = getGuidance(message);
  return (
    <Box flexDirection="column">
      <Text color={colors.error}>Error: {message}</Text>
      {guidance && <Text color={colors.warning}>{guidance}</Text>}
      {onRetry && <Text dimColor>Press r to retry</Text>}
    </Box>
  );
}
