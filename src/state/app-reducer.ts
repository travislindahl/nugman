import type { CacheType, NuGetSource, NuGetCacheLocation, LocalSourcePackage } from "../types.js";

export type AppView =
  | { readonly kind: "main-menu" }
  | { readonly kind: "sources" }
  | { readonly kind: "source-edit"; readonly sourceName: string }
  | { readonly kind: "source-add" }
  | { readonly kind: "cache" }
  | { readonly kind: "cache-browse"; readonly cacheType: CacheType }
  | { readonly kind: "local-source" }
  | { readonly kind: "local-source-add" }
  | { readonly kind: "package-detail"; readonly packagePath: string }
  | { readonly kind: "package-search" }
  | {
      readonly kind: "search-result-detail";
      readonly packageId: string;
      readonly sourceName: string;
      readonly latestVersion: string;
      readonly totalDownloads?: number;
      readonly owners?: string;
    }
  | { readonly kind: "config-viewer" }
  | { readonly kind: "config-file-detail"; readonly filePath: string };

export interface AppState {
  readonly currentView: AppView;
  readonly viewHistory: readonly AppView[];
  readonly sources: readonly NuGetSource[];
  readonly cacheLocations: readonly NuGetCacheLocation[];
  readonly localPackages: readonly LocalSourcePackage[];
  readonly error?: string;
  readonly loading: boolean;
}

export type AppAction =
  | { readonly type: "NAVIGATE"; readonly view: AppView }
  | { readonly type: "GO_BACK" }
  | { readonly type: "SET_SOURCES"; readonly sources: readonly NuGetSource[] }
  | { readonly type: "SET_CACHE_LOCATIONS"; readonly locations: readonly NuGetCacheLocation[] }
  | { readonly type: "SET_LOCAL_PACKAGES"; readonly packages: readonly LocalSourcePackage[] }
  | { readonly type: "SET_ERROR"; readonly error: string }
  | { readonly type: "CLEAR_ERROR" }
  | { readonly type: "SET_LOADING"; readonly loading: boolean };

export const initialState: AppState = {
  currentView: { kind: "main-menu" },
  viewHistory: [],
  sources: [],
  cacheLocations: [],
  localPackages: [],
  loading: false,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "NAVIGATE":
      return {
        ...state,
        currentView: action.view,
        viewHistory: [...state.viewHistory, state.currentView],
        error: undefined,
      };
    case "GO_BACK": {
      const history = [...state.viewHistory];
      const previousView = history.pop() ?? { kind: "main-menu" as const };
      return {
        ...state,
        currentView: previousView,
        viewHistory: history,
        error: undefined,
      };
    }
    case "SET_SOURCES":
      return { ...state, sources: action.sources };
    case "SET_CACHE_LOCATIONS":
      return { ...state, cacheLocations: action.locations };
    case "SET_LOCAL_PACKAGES":
      return { ...state, localPackages: action.packages };
    case "SET_ERROR":
      return { ...state, error: action.error, loading: false };
    case "CLEAR_ERROR":
      return { ...state, error: undefined };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
  }
}
