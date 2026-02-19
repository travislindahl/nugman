const UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  let unitIndex = 0;
  let size = bytes;
  while (size >= 1024 && unitIndex < UNITS.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  const unit = UNITS[unitIndex]!;
  return unitIndex === 0 ? `${size} ${unit}` : `${size.toFixed(1)} ${unit}`;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

export function padRight(str: string, length: number): string {
  return str.padEnd(length);
}
