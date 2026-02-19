import { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput } from "@inkjs/ui";
import { useNavigation } from "../../hooks/use-navigation.js";
import { useAppState } from "../../state/app-context.js";
import * as sourceService from "../../services/nuget-source.js";
import { StatusBar } from "../shared/status-bar.js";
import { ErrorDisplay } from "../shared/error-display.js";
import { strings } from "../../lib/strings.js";
import { colors } from "../../lib/theme.js";

interface SourceEditProps {
  readonly sourceName: string;
}

type EditField = "name" | "url";

const HINTS = [
  { key: "Tab", label: "Next field" },
  { key: "Enter", label: "Save" },
  { key: "Esc", label: "Cancel" },
];

export function SourceEdit({ sourceName }: SourceEditProps): React.ReactNode {
  const { goBack } = useNavigation();
  const state = useAppState();
  const source = state.sources.find((s) => s.name === sourceName);

  const [newName, setNewName] = useState(source?.name ?? "");
  const [newUrl, setNewUrl] = useState(source?.url ?? "");
  const [activeField, setActiveField] = useState<EditField>("name");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await sourceService.updateSource(
        sourceName,
        newName !== sourceName ? newName : undefined,
        newUrl !== source?.url ? newUrl : undefined,
      );
      goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.errors.generic);
      setSaving(false);
    }
  }, [saving, sourceName, newName, newUrl, source?.url, goBack]);

  useInput((_input, key) => {
    if (key.escape) {
      goBack();
    } else if (key.tab) {
      setActiveField((prev) => (prev === "name" ? "url" : "name"));
    }
  });

  if (!source) {
    return <ErrorDisplay message={strings.errors.sourceNotFound} />;
  }

  if (source.configLevel !== "user") {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color={colors.primary}>
          {strings.sources.edit} (Read Only)
        </Text>
        <Box marginY={1} flexDirection="column">
          <Text>Name: {source.name}</Text>
          <Text>URL: {source.url}</Text>
          <Text>Level: {source.configLevel}</Text>
        </Box>
        <StatusBar hints={[{ key: "Esc", label: "Back" }]} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={colors.primary}>
        {strings.sources.edit}
      </Text>
      {error && <ErrorDisplay message={error} />}
      <Box marginY={1} flexDirection="column">
        <Box>
          <Text bold={activeField === "name"}>Name: </Text>
          {activeField === "name" ? (
            <TextInput
              defaultValue={newName}
              onChange={setNewName}
              onSubmit={() => void handleSave()}
            />
          ) : (
            <Text>{newName}</Text>
          )}
        </Box>
        <Box>
          <Text bold={activeField === "url"}>URL: </Text>
          {activeField === "url" ? (
            <TextInput
              defaultValue={newUrl}
              onChange={setNewUrl}
              onSubmit={() => void handleSave()}
            />
          ) : (
            <Text>{newUrl}</Text>
          )}
        </Box>
      </Box>
      <StatusBar hints={HINTS} />
    </Box>
  );
}
