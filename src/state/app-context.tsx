import React, { createContext, useContext, useReducer } from "react";
import type { AppState, AppAction } from "./app-reducer.js";
import { appReducer, initialState } from "./app-reducer.js";

const AppStateContext = createContext<AppState | null>(null);
const AppDispatchContext = createContext<React.Dispatch<AppAction> | null>(null);

export function AppProvider({ children }: { readonly children: React.ReactNode }): React.ReactNode {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>{children}</AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  const state = useContext(AppStateContext);
  if (!state) throw new Error("useAppState must be used within AppProvider");
  return state;
}

export function useAppDispatch(): React.Dispatch<AppAction> {
  const dispatch = useContext(AppDispatchContext);
  if (!dispatch) throw new Error("useAppDispatch must be used within AppProvider");
  return dispatch;
}
