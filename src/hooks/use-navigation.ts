import { useCallback } from "react";
import { useAppDispatch } from "../state/app-context.js";
import type { AppView } from "../state/app-reducer.js";

export function useNavigation() {
  const dispatch = useAppDispatch();

  const navigate = useCallback((view: AppView) => dispatch({ type: "NAVIGATE", view }), [dispatch]);

  const goBack = useCallback(() => dispatch({ type: "GO_BACK" }), [dispatch]);

  const goToMainMenu = useCallback(
    () => dispatch({ type: "NAVIGATE", view: { kind: "main-menu" } }),
    [dispatch],
  );

  return { navigate, goBack, goToMainMenu };
}
