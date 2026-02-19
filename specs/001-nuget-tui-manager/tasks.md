# Tasks: NuGet TUI Manager

**Input**: Design documents from `/specs/001-nuget-tui-manager/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/service-interfaces.md, quickstart.md

**Tests**: Included — plan.md defines a test structure and constitution mandates test-driven quality.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependency installation, and tooling configuration

- [ ] T001 Create project directory structure with all subdirectories per plan.md (src/, src/state/, src/services/, src/components/shared/, src/components/sources/, src/components/cache/, src/components/local-source/, src/components/search/, src/components/config/, src/hooks/, src/lib/, tests/unit/services/, tests/unit/lib/, tests/integration/, tests/component/)
- [ ] T002 Initialize npm project with package.json (type: module, bin: nugman, scripts: dev/build/typecheck/test/test:watch/lint) and install all dependencies per quickstart.md
- [ ] T003 [P] Configure TypeScript with tsconfig.json (strict: true, module: nodenext, jsx: react-jsx, path aliases) per quickstart.md
- [ ] T004 [P] Configure Vitest with vitest.config.ts (globals, node environment, path alias) per quickstart.md
- [ ] T005 [P] Configure ESLint and Prettier for TypeScript + React/JSX with npm lint script

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**Warning**: No user story work can begin until this phase is complete

- [ ] T006 [P] Define all shared TypeScript interfaces and types (NuGetSource, ConfigLevel, NuGetCacheLocation, CacheType, CacheEntry, LocalSourcePackage, PackageMetadata, PackageLicense, RepositoryInfo, DependencyGroup, PackageDependency, PackageSearchResult, SearchResultPackage, NuGetConfigFile, ConfigFileLevel, NuGetConfigContents, ConfigSourceEntry, PackageSourceMapping, SourceHealthResult, HealthStatus, AppConfig, ClearResult, AddPackageResult, PackageIdentity, PackageMetadataResult, ValidationResult, DotnetInfo, ExecOptions, SearchOptions, ConfigOverride) from data-model.md and contracts in src/types.ts
- [ ] T007 [P] Implement platform detection (OS type) and OS-specific config/cache path resolution (Windows: %APPDATA%/nugman, macOS: ~/Library/Application Support/nugman, Linux: ~/.config/nugman) in src/lib/platform.ts
- [ ] T008 [P] Implement byte formatting (human-readable file sizes) and string utilities in src/lib/format.ts
- [ ] T009 [P] Implement dotnet CLI output parsers: parseSourceList (parse `dotnet nuget list source --format Detailed` text output) and parseCacheLocals (parse `dotnet nuget locals all --list` output) in src/lib/parse-cli-output.ts
- [ ] T080 [P] Create shared design token system defining ANSI color constants (primary, secondary, success, error, warning, muted for both light/dark terminal themes), spacing units (line counts, padding characters), and text style helpers (bold, dim, underline) consumed by all UI components in src/lib/theme.ts
- [ ] T081 [P] Create externalized user-facing string constants for all UI text (menu labels, status messages, error messages, confirmation prompts, keyboard hint labels, empty state messages) in src/lib/strings.ts — no hardcoded user-facing strings in component logic per constitution IV
- [ ] T010 Implement DotnetCliService with checkAvailability (dotnet --version), exec (execFile wrapper), and spawn (streaming output) methods in src/services/dotnet-cli.ts
- [ ] T011 [P] Implement AppConfigService with getConfigDir, loadConfig, and saveConfig methods using OS-specific paths in src/services/app-config.ts
- [ ] T012 Define AppView discriminated union, AppState interface, AppAction union, and implement appReducer with NAVIGATE/GO_BACK/SET_SOURCES/SET_CACHE_LOCATIONS/SET_LOCAL_PACKAGES/SET_ERROR/CLEAR_ERROR/SET_LOADING actions in src/state/app-reducer.ts
- [ ] T013 Implement AppContext provider component, useAppState and useAppDispatch hooks wrapping React Context + useReducer in src/state/app-context.tsx
- [ ] T014 [P] Implement useNavigation hook (push view, pop view, go back to main menu) using AppContext dispatch in src/hooks/use-navigation.ts
- [ ] T015 [P] Implement useAsync hook (execute async function with automatic loading/error state management) in src/hooks/use-async.ts
- [ ] T016 [P] Implement useDotnet hook (check dotnet CLI availability on mount, expose available/version/error state) in src/hooks/use-dotnet.ts
- [ ] T017 Create minimal entry point that renders App component with Ink render() in src/cli.tsx
- [ ] T018 Create minimal App root component with AppContext provider, useDotnet check, and view router switch on AppView.kind in src/app.tsx

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 + 10 — View and Manage NuGet Sources + Keyboard-Driven Navigation (Priority: P1) MVP

**Goal**: Display all configured NuGet sources in a navigable list with add/edit/delete/toggle capabilities. Establish all shared UI components and keyboard-driven navigation patterns used by every subsequent story.

**Independent Test**: Launch the app, view the source list, add a source, edit a source URL, toggle enabled/disabled, delete a source — all using only keyboard navigation. All views display consistent keyboard hints in a status bar.

### Shared UI Components (US10)

- [ ] T019 [P] [US10] Create StatusBar component displaying context-sensitive keyboard hints (customizable per-view hint items) in src/components/shared/status-bar.tsx
- [ ] T020 [P] [US10] Create ErrorDisplay component for consistent error rendering (error message + optional retry action) in src/components/shared/error-display.tsx
- [ ] T021 [P] [US10] Create Loading component wrapping @inkjs/ui Spinner with a message in src/components/shared/loading.tsx
- [ ] T022 [P] [US10] Create ConfirmDialog component wrapping @inkjs/ui ConfirmInput for Y/N destructive action confirmation in src/components/shared/confirm-dialog.tsx
- [ ] T023 [P] [US10] Create EmptyState component showing "no items" message with guidance text in src/components/shared/empty-state.tsx
- [ ] T024 [P] [US10] Create ListView component with keyboard navigation (j/k, arrow keys, Enter to select, Escape to go back), focus management, and highlighted active row in src/components/shared/list-view.tsx
- [ ] T025 [US10] Implement MainMenu dashboard with labeled entry points to all feature areas (Sources, Cache, Local Source, Package Search, Config Viewer) using ListView in src/components/main-menu.tsx

### Source Management (US1)

- [ ] T026 [US1] Implement NuGetSourceService with listSources (parse CLI output via parseSourceList), addSource, updateSource, removeSource, enableSource, and disableSource methods wrapping dotnet nuget CLI commands in src/services/nuget-source.ts
- [ ] T027 [US1] Implement SourceList view displaying all sources (name, URL, enabled/disabled badge, config level label, managed source indicator) with ListView, delete confirmation via ConfirmDialog, toggle enabled/disabled action, and keyboard shortcuts for add/edit/delete in src/components/sources/source-list.tsx
- [ ] T028 [P] [US1] Implement SourceEdit view with @inkjs/ui TextInput fields for name and URL, enabled/disabled toggle, save/cancel actions, and read-only display for non-user-level sources in src/components/sources/source-edit.tsx
- [ ] T029 [P] [US1] Implement SourceAdd view with @inkjs/ui TextInput fields for source name and URL, validation feedback, and save/cancel actions in src/components/sources/source-add.tsx
- [ ] T030 [US1] Wire MainMenu and all source views (sources, source-edit, source-add) into the App view router in src/app.tsx

### Tests for US1 + US10

- [ ] T031 [P] [US1] Write unit tests for NuGetSourceService (listSources parsing, addSource, removeSource, enableSource/disableSource) mocking DotnetCliService in tests/unit/services/nuget-source.test.ts
- [ ] T032 [P] [US1] Write unit tests for parseSourceList and parseCacheLocals parsers with sample CLI output in tests/unit/lib/parse-cli-output.test.ts
- [ ] T033 [P] [US10] Write component test for MainMenu (renders all entry points, keyboard navigation selects items) using ink-testing-library in tests/component/main-menu.test.tsx
- [ ] T034 [P] [US1] Write component test for SourceList (renders sources, keyboard navigation, delete confirmation flow) using ink-testing-library in tests/component/source-list.test.tsx

**Checkpoint**: User Story 1 + 10 complete — sources can be viewed, added, edited, deleted, and toggled via keyboard-driven TUI

---

## Phase 4: User Story 2 — View and Clear NuGet Cache (Priority: P2)

**Goal**: Display all NuGet cache locations with disk usage and allow clearing individual or all caches.

**Independent Test**: Navigate to Cache view, see all cache types with sizes, browse a cache's contents, clear a specific cache with confirmation, clear all caches with confirmation.

- [ ] T035 [US2] Implement NuGetCacheService with listCacheLocations (parse CLI output via parseCacheLocals), calculateDiskUsage (recursive directory size via fs), listCacheContents (directory listing), clearCache (dotnet nuget locals type --clear), and clearAllCaches methods in src/services/nuget-cache.ts
- [ ] T036 [US2] Implement CacheList view displaying cache types (http-cache, global-packages, temp, plugins-cache) with disk usage, clear individual/clear all actions with ConfirmDialog, and keyboard navigation in src/components/cache/cache-list.tsx
- [ ] T037 [US2] Implement CacheBrowse view for browsing cache directory contents (file/folder names, sizes) with ListView navigation and back-to-cache-list action in src/components/cache/cache-browse.tsx
- [ ] T038 [US2] Wire cache views (cache, cache-browse) into the App view router in src/app.tsx
- [ ] T039 [P] [US2] Write unit tests for NuGetCacheService (listCacheLocations parsing, calculateDiskUsage, clearCache) mocking DotnetCliService and fs in tests/unit/services/nuget-cache.test.ts
- [ ] T040 [P] [US2] Write component test for CacheList (renders cache types with sizes, clear confirmation flow) using ink-testing-library in tests/component/cache-list.test.tsx

**Checkpoint**: User Story 2 complete — cache locations visible with disk usage, clearable individually or all at once

---

## Phase 5: User Story 3 — Automatic Local NuGet Source (Priority: P3)

**Goal**: Automatically create and maintain a local NuGet source directory, register it as a NuGet source, and protect it from modification in the source management UI.

**Independent Test**: Launch app and verify local source directory exists and is registered. Delete the directory, restart, and verify it is recreated. Verify the managed source cannot be deleted or renamed in the Sources view but can be toggled.

- [ ] T041 [US3] Implement LocalSourceService with initialize method (create local source dir if missing via fs.mkdir recursive, check if nugman-local source is registered via NuGetSourceService.listSources, register via dotnet nuget add source if not found, handle duplicate detection) and getLocalSourcePath method in src/services/local-source.ts
- [ ] T042 [US3] Integrate LocalSourceService.initialize() into App startup flow (after dotnet check, before rendering main menu) with loading indicator and error display in src/app.tsx
- [ ] T043 [US3] Add managed source protection to SourceList: prevent delete/rename for sources with isManaged=true, show read-only name/path, allow only enabled/disabled toggle, display "managed" badge in src/components/sources/source-list.tsx
- [ ] T044 [P] [US3] Write unit tests for LocalSourceService initialize (dir creation, source registration, duplicate handling, re-creation on missing dir) mocking fs and NuGetSourceService in tests/unit/services/local-source.test.ts

**Checkpoint**: User Story 3 complete — local source auto-created and protected on every launch

---

## Phase 6: User Story 4 — Browse and Remove Packages from Local Source (Priority: P4)

**Goal**: Browse packages in the local source with metadata (name, version, size) and remove individual or multiple packages.

**Independent Test**: Navigate to Local Source, view package list with details, select and remove a single package, multi-select and remove multiple packages, verify empty state message when no packages exist.

- [ ] T045 [US4] Implement LocalSourceService listPackages (scan local source dir for .nupkg files, extract identity via PackageMetadataService), removePackage (delete single file), and removePackages (delete multiple files) methods in src/services/local-source.ts
- [ ] T046 [US4] Implement PackageMetadataService readIdentity method (open .nupkg with adm-zip, extract .nuspec, parse id+version with fast-xml-parser) in src/services/package-metadata.ts
- [ ] T047 [US4] Implement PackageList view displaying local packages (name, version, file size) with ListView, multi-select toggle, remove selected with ConfirmDialog, and EmptyState when no packages in src/components/local-source/package-list.tsx
- [ ] T048 [US4] Wire local-source view into the App view router in src/app.tsx
- [ ] T049 [P] [US4] Write component test for PackageList (renders packages, multi-select, remove confirmation, empty state) using ink-testing-library in tests/component/package-list.test.tsx

**Checkpoint**: User Story 4 complete — local packages browsable and removable

---

## Phase 7: User Story 5 — Add Packages to Local Source (Priority: P5)

**Goal**: Add packages to the local source via file import (.nupkg) or project build/pack (dotnet pack), with duplicate detection and validation.

**Independent Test**: Add a .nupkg file by path, verify it appears in the package list. Build/pack a .NET project, verify resulting package appears. Attempt to add a duplicate and verify overwrite prompt. Attempt to add an invalid file and verify error.

- [ ] T050 [US5] Implement PackageMetadataService validate method (tiered validation: .nupkg extension check, valid ZIP via adm-zip, contains .nuspec, valid XML, required fields present) in src/services/package-metadata.ts
- [ ] T051 [US5] Implement LocalSourceService addPackageFromFile (validate .nupkg, extract identity, check duplicate via checkDuplicate, copy to local source dir) and checkDuplicate (match by id+version in existing packages) methods in src/services/local-source.ts
- [ ] T052 [US5] Implement LocalSourceService addPackageFromBuild method (spawn dotnet pack with streaming stdout/stderr to onOutput callback, scan output dir for new .nupkg files on completion) in src/services/local-source.ts
- [ ] T053 [US5] Implement AddPackage view with two modes: file import (@inkjs/ui TextInput for .nupkg file path) and build/pack (@inkjs/ui TextInput for project/solution path with streaming build output display), duplicate overwrite ConfirmDialog, and validation error display in src/components/local-source/add-package.tsx
- [ ] T054 [US5] Wire local-source-add view into the App view router in src/app.tsx
- [ ] T055 [P] [US5] Write unit tests for PackageMetadataService validate and LocalSourceService addPackageFromFile/addPackageFromBuild (validation tiers, duplicate detection, build streaming) in tests/unit/services/package-metadata.test.ts

**Checkpoint**: User Story 5 complete — packages can be added via file import or build/pack

---

## Phase 8: User Story 6 — Source Health Verification (Priority: P6)

**Goal**: Check reachability of configured NuGet sources and display health status alongside each source.

**Independent Test**: Trigger health check from source list, verify reachable sources show healthy, unreachable sources show error details, disabled sources show skipped status.

- [ ] T056 [US6] Implement NuGetSourceService checkHealth (HTTP HEAD request to source URL with timeout, return SourceHealthResult) and checkAllHealth (concurrent health checks for all enabled sources, skip disabled) methods in src/services/nuget-source.ts
- [ ] T057 [US6] Add health check trigger (keyboard shortcut) and per-source health status indicators (healthy/unhealthy/disabled/checking badges with error details) to SourceList view in src/components/sources/source-list.tsx
- [ ] T058 [P] [US6] Add unit tests for checkHealth and checkAllHealth (healthy response, timeout, DNS failure, disabled source skipping) to tests/unit/services/nuget-source.test.ts

**Checkpoint**: User Story 6 complete — source health visible at a glance

---

## Phase 9: User Story 7 — Package Search Across Sources (Priority: P7)

**Goal**: Search for packages across all enabled NuGet sources and view result details (informational only, no install/add actions).

**Independent Test**: Navigate to search, enter a query, view results from multiple sources, select a result to see version details. Verify graceful handling when a source is unreachable.

- [ ] T059 [US7] Implement PackageSearchService search method (execute dotnet package search --format json, parse JSON response, report per-source problems from problems array) in src/services/package-search.ts
- [ ] T060 [US7] Implement SearchView with @inkjs/ui TextInput for search term, results display grouped by source (package name, latest version, description), loading indicator during search, and "no results" EmptyState in src/components/search/search-view.tsx
- [ ] T061 [US7] Implement SearchDetail view showing package versions, description, owners, download count, and originating source (read-only, no actions) in src/components/search/search-detail.tsx
- [ ] T062 [US7] Wire search views (package-search, search-result-detail) into the App view router in src/app.tsx
- [ ] T063 [P] [US7] Write unit tests for PackageSearchService (JSON parsing, multi-source results, problems array handling, search options) in tests/unit/services/package-search.test.ts

**Checkpoint**: User Story 7 complete — package search functional across all enabled sources

---

## Phase 10: User Story 8 — Package Version Inspection (Priority: P8)

**Goal**: View detailed metadata for packages in the local source or cache, including dependencies grouped by target framework.

**Independent Test**: Select a package from local source or cache, view full metadata (ID, version, authors, description, license, dependencies by framework, target frameworks). Verify graceful handling of corrupted/unreadable .nupkg.

- [ ] T064 [US8] Implement PackageMetadataService readMetadata method (full .nuspec parsing: id, version, authors, description, title, license, projectUrl, copyright, tags, releaseNotes, repository, dependencies grouped by targetFramework, targetFrameworks from lib/ folder) in src/services/package-metadata.ts
- [ ] T065 [US8] Implement PackageDetail view displaying full metadata (header with id+version+authors, description, license, dependencies grouped by target framework with version constraints, supported frameworks list) in src/components/package-detail.tsx
- [ ] T066 [US8] Integrate PackageDetail navigation: add "inspect" action to PackageList (local source) and CacheBrowse views that navigates to package-detail view in src/components/local-source/package-list.tsx and src/components/cache/cache-browse.tsx
- [ ] T067 [P] [US8] Add unit tests for readMetadata (full parsing, dependency groups, partial metadata on malformed .nuspec, error on corrupted .nupkg) to tests/unit/services/package-metadata.test.ts

**Checkpoint**: User Story 8 complete — full package metadata inspection available from local source and cache views

---

## Phase 11: User Story 9 — NuGet Config File Viewer (Priority: P9)

**Goal**: View the NuGet configuration file hierarchy in precedence order, inspect config file contents, and see override relationships between files.

**Independent Test**: Navigate to Config Viewer, see config files listed in precedence order, select a file to view contents (sources, mappings, settings), verify override indicators when higher-precedence file overrides a lower one.

- [ ] T068 [US9] Implement NuGetConfigService with listConfigFiles (discover config files by walking up from cwd + known user/machine paths, determine precedence level), readConfigFile (parse nuget.config XML with fast-xml-parser), and computeOverrides (compare settings across files in precedence order) methods in src/services/nuget-config.ts
- [ ] T069 [US9] Implement ConfigList view displaying config files in precedence order (path, level label, readable/error indicator) with ListView navigation in src/components/config/config-list.tsx
- [ ] T070 [US9] Implement ConfigDetail view showing parsed config contents (sources table, disabled sources, package source mappings, other settings) with override indicators (highlighted settings that override lower-precedence values) in src/components/config/config-detail.tsx
- [ ] T071 [US9] Wire config views (config-viewer, config-file-detail) into the App view router in src/app.tsx
- [ ] T082 [P] [US9] Write unit tests for NuGetConfigService (listConfigFiles discovery and precedence ordering, readConfigFile XML parsing, computeOverrides detection across config levels, error handling for unreadable files) in tests/unit/services/nuget-config.test.ts

**Checkpoint**: User Story 9 complete — full config hierarchy visible with override analysis

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Tests for foundational utilities, integration tests, edge cases, and final validation

- [ ] T072 [P] Write unit tests for platform detection and OS-specific path resolution in tests/unit/lib/platform.test.ts
- [ ] T073 [P] Write unit tests for byte formatting and string utilities in tests/unit/lib/format.test.ts
- [ ] T074 [P] Write unit tests for DotnetCliService (checkAvailability, exec success/failure, spawn streaming, ENOENT handling) in tests/unit/services/dotnet-cli.test.ts
- [ ] T075 [P] Write integration test for source management workflow (list → add → edit → toggle → delete) using ink-testing-library in tests/integration/source-management.test.tsx
- [ ] T076 [P] Write integration test for cache management workflow (list → browse → clear individual → clear all) using ink-testing-library in tests/integration/cache-management.test.tsx
- [ ] T077 [P] Write integration test for local source workflow (init → add package → browse → remove) using ink-testing-library in tests/integration/local-source.test.tsx
- [ ] T078 [P] Add edge case handling: startup environment validation (missing dotnet CLI error screen with install guidance, missing/corrupted NuGet config graceful fallback with offer to initialize defaults) across src/app.tsx and relevant service error paths
- [ ] T083 [P] Write unit tests for AppConfigService (getConfigDir returns correct path per OS, loadConfig creates defaults when missing, saveConfig persists to disk) in tests/unit/services/app-config.test.ts
- [ ] T084 [P] Add edge case handling: filesystem permission errors (clear permission error messages with OS-specific resolution guidance for cache directories, local source directory, and config files) in src/components/shared/error-display.tsx and service catch blocks
- [ ] T085 [P] Add edge case handling: invalid input graceful degradation (corrupted .nupkg validation errors, malformed .nuspec partial metadata display, missing build output warning, invalid file path errors) in relevant service and component files
- [ ] T086 Add edge case handling: small terminal size detection (minimum 80x24 terminal size, display "terminal too small" message when below threshold) in src/app.tsx
- [ ] T079 Run quickstart.md validation: verify npm run dev launches successfully, npm test passes all tests, npm run typecheck reports no errors, npm run lint passes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1+US10 (Phase 3)**: Depends on Foundational — no other story dependencies
- **US2 (Phase 4)**: Depends on Foundational — independent of US1
- **US3 (Phase 5)**: Depends on US1 (uses NuGetSourceService to register local source)
- **US4 (Phase 6)**: Depends on US3 (local source must be initialized)
- **US5 (Phase 7)**: Depends on US4 (builds on LocalSourceService and PackageMetadataService)
- **US6 (Phase 8)**: Depends on US1 (extends NuGetSourceService with health methods)
- **US7 (Phase 9)**: Depends on Foundational — independent of other stories
- **US8 (Phase 10)**: Depends on US4 (extends PackageMetadataService, integrates with PackageList and CacheBrowse)
- **US9 (Phase 11)**: Depends on Foundational — independent of other stories
- **Polish (Phase 12)**: Depends on all user stories being complete

### User Story Dependencies

```
Foundational
├── US1+US10 (P1) ──┬── US3 (P3) → US4 (P4) → US5 (P5)
│                    └── US6 (P6)
├── US2 (P2) ←──────── (independent)
├── US7 (P7) ←──────── (independent)
└── US9 (P9) ←──────── (independent)

US4 (P4) → US8 (P8)
```

### Within Each User Story

- Implementation tasks in dependency order (services before views)
- Views wired into router after implementation
- Tests after implementation within the same phase
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks T003-T005 can run in parallel
- All Foundational tasks marked [P] (T006-T009, T011, T014-T016, T080-T081) can run in parallel
- After Foundational: US2, US7, and US9 can run in parallel with US1+US10
- Within US1+US10: All shared component tasks T019-T024 can run in parallel
- Within US1+US10: T028 and T029 (SourceEdit and SourceAdd) can run in parallel
- Within US1+US10: All test tasks T031-T034 can run in parallel
- Within US2: T039 and T040 can run in parallel
- All Polish phase tests T072-T077 and T083 can run in parallel
- Edge case tasks T078, T084-T086 can run in parallel

---

## Parallel Example: User Story 1 + 10

```text
# Step 1: Launch all shared UI components in parallel:
T019: StatusBar in src/components/shared/status-bar.tsx
T020: ErrorDisplay in src/components/shared/error-display.tsx
T021: Loading in src/components/shared/loading.tsx
T022: ConfirmDialog in src/components/shared/confirm-dialog.tsx
T023: EmptyState in src/components/shared/empty-state.tsx
T024: ListView in src/components/shared/list-view.tsx

# Step 2: MainMenu (depends on ListView):
T025: MainMenu in src/components/main-menu.tsx

# Step 3: Source service (depends on Foundational):
T026: NuGetSourceService in src/services/nuget-source.ts

# Step 4: Source views in parallel (depend on T026 + shared components):
T027: SourceList in src/components/sources/source-list.tsx
T028: SourceEdit in src/components/sources/source-edit.tsx
T029: SourceAdd in src/components/sources/source-add.tsx

# Step 5: Wire into router:
T030: Update src/app.tsx

# Step 6: All tests in parallel:
T031: nuget-source.test.ts
T032: parse-cli-output.test.ts
T033: main-menu.test.tsx
T034: source-list.test.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 + 10 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 + 10
4. **STOP and VALIDATE**: Test source management and keyboard navigation independently
5. Deploy/demo if ready — the app can list, add, edit, delete, and toggle NuGet sources

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 + US10 → Source management + navigation → **MVP!**
3. US2 → Cache management (can run in parallel with US3 if desired)
4. US3 → Auto local source
5. US4 → Browse/remove local packages
6. US5 → Add packages to local source
7. US6 → Health verification
8. US7 → Package search (can be done earlier since independent)
9. US8 → Package inspection
10. US9 → Config viewer (can be done earlier since independent)
11. Polish → Integration tests, edge cases, validation

### Parallel Team Strategy

With multiple developers after Foundational is complete:

- **Developer A**: US1 + US10 (P1) → US3 (P3) → US4 (P4) → US5 (P5) → US6 (P6) → US8 (P8)
- **Developer B**: US2 (P2) → US7 (P7) → US9 (P9)
- Stories integrate independently via shared types and App router

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in the same phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable at its checkpoint
- Commit after each task or logical group of tasks
- Stop at any checkpoint to validate the story independently
- All services follow the interfaces defined in contracts/service-interfaces.md
- All data types follow the definitions in data-model.md
- CLI output parsing strategies documented in research.md
