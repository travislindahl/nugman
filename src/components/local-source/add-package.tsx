import { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import { TextInput } from "@inkjs/ui";
import { useNavigation } from "../../hooks/use-navigation.js";
import * as localSource from "../../services/local-source.js";
import { StatusBar } from "../shared/status-bar.js";
import { ErrorDisplay } from "../shared/error-display.js";
import { Loading } from "../shared/loading.js";
import { strings } from "../../lib/strings.js";
import { colors } from "../../lib/theme.js";

type AddMode = "file" | "build";

const HINTS = [
  { key: "Tab", label: "Switch mode" },
  { key: "Enter", label: "Submit" },
  { key: "Esc", label: "Cancel" },
];

export function AddPackage(): React.ReactNode {
  const { goBack } = useNavigation();
  const [mode, setMode] = useState<AddMode>("file");
  const [inputPath, setInputPath] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buildOutput, setBuildOutput] = useState<string[]>([]);

  const handleSubmit = useCallback(async () => {
    if (processing || !inputPath.trim()) return;
    setProcessing(true);
    setError(null);

    try {
      if (mode === "file") {
        const result = await localSource.addPackageFromFile(inputPath.trim());
        if (result.kind === "error") {
          setError(result.message);
          setProcessing(false);
        } else {
          goBack();
        }
      } else {
        const result = await localSource.addPackageFromBuild(inputPath.trim(), (line) => {
          setBuildOutput((prev) => [...prev.slice(-20), line]);
        });
        if (result.kind === "error") {
          setError(result.message);
          setProcessing(false);
        } else {
          goBack();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.errors.generic);
      setProcessing(false);
    }
  }, [processing, inputPath, mode, goBack]);

  useInput((_input, key) => {
    if (key.escape) {
      goBack();
    } else if (key.tab && !processing) {
      setMode((prev) => (prev === "file" ? "build" : "file"));
      setInputPath("");
      setBuildOutput([]);
      setError(null);
    }
  });

  if (processing) {
    return (
      <Box flexDirection="column" padding={1}>
        <Loading message={mode === "file" ? "Adding package..." : "Building..."} />
        {buildOutput.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            {buildOutput.slice(-10).map((line, i) => (
              <Text key={i} dimColor>
                {line}
              </Text>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={colors.primary}>
        {mode === "file" ? strings.localSource.addFromFile : strings.localSource.addFromBuild}
      </Text>
      <Box marginY={1} flexDirection="column">
        <Box>
          <Text bold>{mode === "file" ? "File path: " : "Project path: "}</Text>
          <TextInput
            placeholder={mode === "file" ? "/path/to/package.nupkg" : "/path/to/project.csproj"}
            onChange={setInputPath}
            onSubmit={() => void handleSubmit()}
          />
        </Box>
      </Box>
      {error && <ErrorDisplay message={error} />}
      <Text dimColor>
        Mode: {mode === "file" ? "Import .nupkg file" : "Build with dotnet pack"} (Tab to switch)
      </Text>
      <StatusBar hints={HINTS} />
    </Box>
  );
}
