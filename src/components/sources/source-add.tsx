import { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput } from "@inkjs/ui";
import { useNavigation } from "../../hooks/use-navigation.js";
import * as sourceService from "../../services/nuget-source.js";
import { StatusBar } from "../shared/status-bar.js";
import { ErrorDisplay } from "../shared/error-display.js";
import { strings } from "../../lib/strings.js";
import { colors } from "../../lib/theme.js";

type AddField = "name" | "url";

const HINTS = [
  { key: "Tab", label: "Next field" },
  { key: "Enter", label: "Save" },
  { key: "Esc", label: "Cancel" },
];

export function SourceAdd(): React.ReactNode {
  const { goBack } = useNavigation();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [activeField, setActiveField] = useState<AddField>("name");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    if (saving || !name.trim() || !url.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await sourceService.addSource(name.trim(), url.trim());
      goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.errors.generic);
      setSaving(false);
    }
  }, [saving, name, url, goBack]);

  useInput((_input, key) => {
    if (key.escape) {
      goBack();
    } else if (key.tab) {
      setActiveField((prev) => (prev === "name" ? "url" : "name"));
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={colors.primary}>
        {strings.sources.addNew}
      </Text>
      {error && <ErrorDisplay message={error} />}
      <Box marginY={1} flexDirection="column">
        <Box>
          <Text bold={activeField === "name"}>Name: </Text>
          {activeField === "name" ? (
            <TextInput
              placeholder="Source name"
              onChange={setName}
              onSubmit={() => setActiveField("url")}
            />
          ) : (
            <Text>{name || "(empty)"}</Text>
          )}
        </Box>
        <Box>
          <Text bold={activeField === "url"}>URL: </Text>
          {activeField === "url" ? (
            <TextInput
              placeholder="https://..."
              onChange={setUrl}
              onSubmit={() => void handleSave()}
            />
          ) : (
            <Text>{url || "(empty)"}</Text>
          )}
        </Box>
      </Box>
      {!name.trim() && <Text dimColor>Name is required</Text>}
      {!url.trim() && activeField === "url" && <Text dimColor>URL is required</Text>}
      <StatusBar hints={HINTS} />
    </Box>
  );
}
