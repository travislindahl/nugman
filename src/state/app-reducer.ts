import type { CacheType, NuGetSource, NuGetCacheLocation, LocalSourcePackage } from "../types.js";

interface ViewBase {
  readonly selectedIndex?: number;
}

export type AppView =
  | (ViewBase & { readonly kind: "main-menu" })
  | (ViewBase & { readonly kind: "sources" })
  | (ViewBase & { readonly kind: "source-edit"; readonly sourceName: string })
  | (ViewBase & { readonly kind: "source-add" })
  | (ViewBase & { readonly kind: "cache" })
  | (ViewBase & { readonly kind: "cache-browse"; readonly cacheType: CacheType })
  | (ViewBase & { readonly kind: "local-source" })
  | (ViewBase & { readonly kind: "local-source-add" })
  | (ViewBase & { readonly kind: "package-detail"; readonly packagePath: string })
  | (ViewBase & { readonly kind: "package-search" })
  | (ViewBase & {
      readonly kind: "search-result-detail";
      readonly packageId: string;
      readonly sourceName: string;
      readonly latestVersion: string;
      readonly totalDownloads?: number;
      readonly owners?: string;
    })
  | (ViewBase & { readonly kind: "config-viewer" })
  | (ViewBase & { readonly kind: "config-file-detail"; readonly filePath: string });

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
  | { readonly type: "NAVIGATE"; readonly view: AppView; readonly fromSelectedIndex?: number }
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
        viewHistory: [
          ...state.viewHistory,
          action.fromSelectedIndex != null
            ? { ...state.currentView, selectedIndex: action.fromSelectedIndex }
            : state.currentView,
        ],
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
