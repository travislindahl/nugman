# Feature Specification: NuGet TUI Manager

**Feature Branch**: `001-nuget-tui-manager`
**Created**: 2026-02-18
**Status**: Draft
**Input**: User description: "Create a Terminal UI (TUI) application that allows me to easily manage my dotnet nuget configurations, cache, sources, and that also hosts a local nuget source that can easily be targeted for building and packing packages locally."

## Clarifications

### Session 2026-02-18

- Q: Which operating systems must the application support? → A: Windows, macOS, and Linux (full cross-platform).
- Q: Which NuGet configuration level should source management operate on? → A: User-level only for writes (add/edit/delete); read/display the merged view from all levels.
- Q: Should the managed local source be protected from modification in the source management UI? → A: Yes, protected — cannot be deleted or renamed; URL/path is read-only; can only toggle enabled/disabled.
- Q: Should the NuGet Config Viewer allow editing config files, or be strictly read-only? → A: Read-only — view and inspect config files, no editing capability.
- Q: Should package search results offer actions (install, add to local source), or be purely informational? → A: Informational only — view package details and versions, no install/add actions.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View and Manage NuGet Sources (Priority: P1)

As a .NET developer, I want to view all my configured NuGet sources in a navigable list so I can quickly understand my current source configuration, and add, edit, or remove sources without memorizing CLI commands.

**Why this priority**: Source management is the most fundamental operation. Without knowing what sources are configured, all other features lack context. This is the entry point for everyday NuGet workflow management.

**Independent Test**: Can be fully tested by launching the application, viewing the source list, editing a source URL, removing a test source, and adding a new source. Delivers immediate value by replacing `dotnet nuget list source` / `dotnet nuget update source` / `dotnet nuget remove source` CLI workflows.

**Acceptance Scenarios**:

1. **Given** the application is launched, **When** the user navigates to the Sources view, **Then** all configured NuGet sources from the merged configuration hierarchy are displayed in a navigable list showing source name, URL, enabled/disabled status, and which configuration level defines the source (user, project, machine).
2. **Given** the user is viewing the sources list, **When** they select a source and choose to edit it, **Then** they can modify the source name, URL, and enabled/disabled status, and changes are persisted to the NuGet configuration.
3. **Given** the user is viewing the sources list, **When** they choose to delete a source and confirm the action, **Then** the source is removed from the NuGet configuration and the list updates immediately.
4. **Given** the user is viewing the sources list, **When** they choose to add a new source, **Then** they can provide a name and URL, and the source is added to the NuGet configuration.
5. **Given** the user is viewing the sources list, **When** they toggle a source's enabled/disabled status, **Then** the change is reflected immediately in both the UI and the NuGet configuration.

---

### User Story 2 - View and Clear NuGet Cache/Locals (Priority: P2)

As a .NET developer, I want to view all NuGet local cache locations (http-cache, global-packages, temp, plugins-cache) with their disk usage and contents, and selectively clear them to free up disk space or resolve caching issues.

**Why this priority**: Cache management is a frequent developer need, especially when troubleshooting package resolution issues or reclaiming disk space. This is the second most common NuGet maintenance task after source management.

**Independent Test**: Can be fully tested by viewing cache locations, inspecting their contents and sizes, clearing individual caches, and clearing all caches at once. Delivers value by replacing the `dotnet nuget locals` CLI workflow with a visual, interactive experience.

**Acceptance Scenarios**:

1. **Given** the application is launched, **When** the user navigates to the Cache view, **Then** all NuGet local cache types are listed with their filesystem location and total disk usage.
2. **Given** the user is viewing cache details, **When** they select a specific cache type, **Then** they can browse its contents (packages, folders) in a navigable list.
3. **Given** the user is viewing cache details, **When** they choose to clear a specific cache type and confirm, **Then** that cache is cleared and the disk usage updates to reflect the change.
4. **Given** the user is viewing cache details, **When** they choose to clear all caches and confirm, **Then** all NuGet local caches are cleared and disk usage updates across all cache types.
5. **Given** a cache clear operation fails (e.g., files locked by another process), **When** the operation completes, **Then** the user sees a clear error message indicating which items could not be cleared and why.

---

### User Story 3 - Automatic Local NuGet Source (Priority: P3)

As a .NET developer, I want the application to automatically create and maintain a local NuGet source directory in the application's configuration folder so I always have a convenient local feed available for development without manual setup.

**Why this priority**: A persistent local source is the foundation for the local development workflow features (adding/removing packages). It must exist reliably before those features can function.

**Independent Test**: Can be fully tested by launching the application and verifying the local source exists, deleting the local source directory and restarting the application to verify it is recreated, and confirming the local source appears as a registered NuGet source.

**Acceptance Scenarios**:

1. **Given** the application is launched for the first time, **When** initialization completes, **Then** a local NuGet source directory is created in the OS-appropriate application configuration folder and registered as a NuGet source.
2. **Given** the local source directory has been manually deleted, **When** the application starts, **Then** the directory is recreated and the NuGet source registration is verified/restored.
3. **Given** the application is running, **When** the user navigates to the local source in the Sources view, **Then** it is clearly distinguished from other configured sources (e.g., labeled as the managed local source) and its name and path are displayed as read-only.
4. **Given** the user attempts to delete or rename the managed local source, **When** the action is triggered, **Then** the action is prevented and the user is informed that the managed local source is protected.
5. **Given** the user selects the managed local source, **When** they toggle its enabled/disabled status, **Then** the change is applied normally.
6. **Given** the local source already exists and is properly registered, **When** the application starts, **Then** no duplicate source is created and the existing source is preserved.

---

### User Story 4 - Browse and Remove Packages from Local Source (Priority: P4)

As a .NET developer, I want to browse the contents of my local NuGet source and remove specific packages so I can keep my local feed clean and manage which package versions are available locally.

**Why this priority**: Being able to inspect and curate the local source is essential for maintaining a useful local development feed. This enables cleanup of old or broken package builds.

**Independent Test**: Can be fully tested by viewing packages in the local source, inspecting package details (name, version, size), and removing selected packages. Delivers value by providing visibility into the local feed.

**Acceptance Scenarios**:

1. **Given** the local NuGet source contains packages, **When** the user navigates to the Local Source view, **Then** all packages are listed with name, version, and file size.
2. **Given** the user is viewing the local source contents, **When** they select a package and choose to remove it, **Then** the package file is deleted from the local source and the list updates.
3. **Given** the local source is empty, **When** the user navigates to the Local Source view, **Then** a helpful message is displayed indicating no packages are present and suggesting how to add packages.
4. **Given** the user selects multiple packages, **When** they choose to remove them and confirm, **Then** all selected packages are removed from the local source.

---

### User Story 5 - Add Packages to Local Source (Priority: P5)

As a .NET developer, I want to add packages to my local NuGet source either by building/packing a .NET project or by importing an existing .nupkg file, so I can quickly make locally-built packages available for other projects to consume.

**Why this priority**: This is the primary workflow that makes the local source useful for development. Building, packing, and publishing locally is a core inner-loop development activity for library authors.

**Independent Test**: Can be fully tested by adding a .nupkg file to the local source, building/packing a project into the local source, and verifying the packages appear in the local source listing.

**Acceptance Scenarios**:

1. **Given** the user is in the Local Source view, **When** they choose to add a package via file, **Then** they can browse/specify a path to a .nupkg file which is copied into the local source.
2. **Given** the user is in the Local Source view, **When** they choose to add a package via build, **Then** they can browse/specify a path to a .NET project or solution file, the project is built and packed, and the resulting .nupkg is added to the local source.
3. **Given** a .nupkg file with the same package ID and version already exists in the local source, **When** the user attempts to add a duplicate, **Then** they are prompted to overwrite or cancel.
4. **Given** a build/pack operation fails, **When** the operation completes, **Then** the user sees the build output/errors so they can diagnose the issue.
5. **Given** the user specifies an invalid file path or a file that is not a valid .nupkg, **When** the add operation is attempted, **Then** a clear error message is displayed.

---

### User Story 6 - Source Health Verification (Priority: P6)

As a .NET developer, I want to quickly check whether my configured NuGet sources are reachable and responding, so I can diagnose package restore failures caused by unavailable sources.

**Why this priority**: This is a valuable diagnostic feature that helps developers troubleshoot issues, but is not part of the core management workflow. It supplements the source management features.

**Independent Test**: Can be fully tested by running a health check against all configured sources and verifying that reachable sources show as healthy and unreachable sources show as unhealthy with error details.

**Acceptance Scenarios**:

1. **Given** the user is viewing the sources list, **When** they trigger a health check, **Then** each source is tested for reachability and the result (healthy/unhealthy/disabled) is displayed alongside each source.
2. **Given** a source is unreachable, **When** the health check completes, **Then** the error details (timeout, DNS failure, authentication error, etc.) are displayed for the failing source.
3. **Given** a source is disabled, **When** the health check runs, **Then** disabled sources are skipped or clearly marked as "disabled - not checked."

---

### User Story 7 - Package Search Across Sources (Priority: P7)

As a .NET developer, I want to search for packages across my configured NuGet sources directly from the TUI, so I can quickly find packages without switching to a browser or separate CLI command.

**Why this priority**: Package search is a natural companion to source management. Being able to discover packages without leaving the TUI makes it a more complete NuGet workflow tool, but it builds on top of the core source and local source features.

**Independent Test**: Can be fully tested by entering a search query, viewing results from enabled sources, and inspecting result details (package name, version, description, source). Delivers value by replacing `dotnet package search` or browser-based nuget.org searches.

**Acceptance Scenarios**:

1. **Given** the user navigates to the Package Search view, **When** they enter a search term, **Then** results are displayed from all enabled NuGet sources showing package name, latest version, and description.
2. **Given** search results are displayed, **When** the user selects a result, **Then** they can view additional details including all available versions and which source(s) provide the package. No install or add actions are available from search results.
3. **Given** the user performs a search, **When** one or more sources are unreachable or slow, **Then** results from available sources are shown promptly and failing sources are indicated with an error note.
4. **Given** the user performs a search with no results, **When** the search completes, **Then** a message indicates no packages matched and suggests broadening the search term.

---

### User Story 8 - Package Version Inspection (Priority: P8)

As a .NET developer, I want to view detailed metadata for packages in my local source or cache, including dependencies, target frameworks, and description, so I can understand what a package provides before consuming it.

**Why this priority**: Metadata inspection deepens the usefulness of the local source and cache views. It helps developers verify they have the right package and version without needing external tools, but depends on the browsing features being in place first.

**Independent Test**: Can be fully tested by selecting a package in the local source or cache view and viewing its metadata (ID, version, authors, description, dependencies, target frameworks). Delivers value by providing at-a-glance package information.

**Acceptance Scenarios**:

1. **Given** the user is viewing a package in the Local Source or Cache view, **When** they select to inspect it, **Then** the package metadata is displayed including: package ID, version, authors, description, license, dependencies, and supported target frameworks.
2. **Given** a package has dependencies, **When** the metadata is displayed, **Then** dependencies are listed grouped by target framework with their version constraints.
3. **Given** a .nupkg file is corrupted or has unreadable metadata, **When** the user attempts to inspect it, **Then** a clear error is displayed indicating the metadata could not be read.

---

### User Story 9 - NuGet Config File Viewer (Priority: P9)

As a .NET developer, I want to view the NuGet configuration file hierarchy showing which config files are active and their precedence, so I can understand where my NuGet settings are coming from and troubleshoot configuration issues.

**Why this priority**: Understanding the NuGet config hierarchy is essential for debugging configuration issues, but most developers only need this occasionally. It complements the source management and diagnostic features.

**Independent Test**: Can be fully tested by viewing the config file hierarchy, selecting a config file to see its contents, and verifying that file precedence order matches dotnet CLI behavior.

**Acceptance Scenarios**:

1. **Given** the user navigates to the Config Viewer, **When** the view loads, **Then** all active NuGet configuration files are listed in precedence order (most specific to most general) with their filesystem paths.
2. **Given** the config file list is displayed, **When** the user selects a config file, **Then** its contents are displayed in a readable format showing configured sources, package source mappings, and other settings.
3. **Given** the user is viewing a config file, **When** a setting in this file overrides a setting from a lower-precedence file, **Then** the override relationship is indicated visually.
4. **Given** a config file cannot be read (permissions, corruption), **When** the viewer loads, **Then** the file is listed with an error indicator and details are shown when selected.

---

### User Story 10 - Keyboard-Driven Navigation (Priority: P1)

As a .NET developer, I want all features accessible through intuitive keyboard navigation with a consistent look and feel across all views, so I can work efficiently without reaching for the mouse.

**Why this priority**: This is a foundational UX requirement that applies to all features. The TUI must be keyboard-first to be useful in a terminal environment. Co-prioritized with P1 as it is intrinsic to the application's usability.

**Independent Test**: Can be fully tested by navigating through every view and performing every action using only the keyboard, verifying that navigation patterns are consistent and discoverable.

**Acceptance Scenarios**:

1. **Given** any view is displayed, **When** the user looks at the screen, **Then** available keyboard shortcuts or navigation hints are visible (e.g., in a status bar or help line).
2. **Given** the user is in any list view, **When** they use standard navigation keys (arrow keys, j/k, Enter, Escape), **Then** list navigation behaves consistently across all views.
3. **Given** the user is performing a destructive action (delete, clear), **When** the action is triggered, **Then** a confirmation prompt is displayed before the action is executed.
4. **Given** the user is in any view, **When** they press the designated key to return to the main menu or previous view, **Then** navigation is immediate and predictable.
5. **Given** the application is launched, **When** the main screen is displayed, **Then** a main menu or dashboard provides clear entry points to all feature areas (Sources, Cache, Local Source, Package Search, Config Viewer).

---

### Edge Cases

- What happens when the dotnet CLI is not installed or not on PATH? The application should detect this at startup and display a clear error message.
- What happens when the NuGet configuration file is missing or corrupted? The application should gracefully handle this with an error message and, where possible, offer to initialize a default configuration.
- What happens when the user lacks filesystem permissions to the cache or local source directories? Clear permission error messages should be shown with guidance on resolving the issue.
- What happens when a .nupkg file is corrupted or not a valid NuGet package? The application should validate the file before adding it and display a descriptive error.
- What happens when a build/pack operation produces no .nupkg output? The application should inform the user that no package was produced and show relevant build output.
- What happens when the local source directory is deleted while the application is running? The application should detect this and offer to recreate the directory.
- What happens when cache directories are locked by another process (e.g., a running build)? The application should report which specific items could not be cleared.
- What happens when the terminal window is very small? The application should handle small terminal sizes gracefully, either by adapting layout or showing a minimum size warning.
- What happens when a package search is performed against a source that requires authentication? The application should indicate the authentication failure clearly and still show results from other sources.
- What happens when a package's .nuspec metadata is malformed? The application should show whatever metadata it can read and indicate which fields could not be parsed.
- What happens when no NuGet config files are found? The application should indicate that only default/machine-level configuration is active.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display all configured NuGet package sources from the merged configuration hierarchy in a navigable list showing source name, URL/path, enabled/disabled status, and originating configuration level (user, project, machine).
- **FR-002**: System MUST allow users to add new NuGet package sources to the user-level configuration by specifying a name and URL/path.
- **FR-003**: System MUST allow users to edit existing user-level NuGet package source properties (name, URL/path, enabled/disabled status). Sources defined at project or machine level MUST be displayed as read-only with their origin indicated.
- **FR-004**: System MUST allow users to delete user-level NuGet package sources with a confirmation step. Sources defined at project or machine level MUST NOT be deletable through the application.
- **FR-005**: System MUST allow users to toggle the enabled/disabled status of NuGet package sources.
- **FR-006**: System MUST display all NuGet local cache types (http-cache, global-packages, temp, plugins-cache) with their filesystem paths and total disk usage.
- **FR-007**: System MUST allow users to browse the contents of each NuGet local cache type.
- **FR-008**: System MUST allow users to clear individual NuGet local cache types with a confirmation step.
- **FR-009**: System MUST allow users to clear all NuGet local caches at once with a confirmation step.
- **FR-010**: System MUST automatically create a local NuGet source directory in the OS-appropriate application configuration folder on startup if it does not exist.
- **FR-011**: System MUST automatically register the local source directory as a NuGet source if it is not already registered.
- **FR-012**: System MUST recreate the local source directory and re-register the NuGet source if the directory is missing at startup.
- **FR-012a**: System MUST protect the managed local source from deletion and renaming in the source management UI. Only the enabled/disabled toggle is permitted.
- **FR-013**: System MUST display the contents of the local NuGet source showing package name, version, and file size.
- **FR-014**: System MUST allow users to remove individual packages from the local NuGet source.
- **FR-015**: System MUST allow users to remove multiple selected packages from the local NuGet source in a single operation.
- **FR-016**: System MUST allow users to add a .nupkg file to the local source by specifying or browsing to a file path.
- **FR-017**: System MUST allow users to add a package to the local source by building and packing a specified .NET project or solution file.
- **FR-018**: System MUST prompt the user when adding a package that would overwrite an existing package with the same ID and version.
- **FR-019**: System MUST display build output and errors when a build/pack operation fails.
- **FR-020**: System MUST verify dotnet CLI availability at startup and display a clear error if it is not found.
- **FR-021**: System MUST provide consistent keyboard-driven navigation across all views with visible shortcut hints.
- **FR-022**: System MUST require confirmation before any destructive operation (delete source, clear cache, remove package).
- **FR-023**: System MUST provide a main menu or dashboard with clear entry points to all feature areas.
- **FR-024**: System MUST allow users to check the reachability/health of configured NuGet sources.
- **FR-025**: System MUST display appropriate error messages when operations fail due to permissions, network issues, or invalid input.
- **FR-026**: System MUST use the OS-appropriate configuration folder for storing application data.
- **FR-027**: System MUST allow users to search for packages across all enabled NuGet sources by entering a search term.
- **FR-028**: System MUST display package search results showing package name, latest version, description, and originating source.
- **FR-029**: System MUST allow users to view detailed information for a search result including all available versions. Search is informational only — no install or add-to-source actions are provided.
- **FR-030**: System MUST handle slow or unreachable sources during search gracefully, showing results from available sources without blocking.
- **FR-031**: System MUST allow users to view detailed metadata for any package in the local source or cache, including package ID, version, authors, description, license, dependencies, and target frameworks.
- **FR-032**: System MUST display package dependencies grouped by target framework with version constraints.
- **FR-033**: System MUST display the NuGet configuration file hierarchy in precedence order showing all active config file paths.
- **FR-034**: System MUST allow users to view the contents of each NuGet configuration file in a readable, read-only format. No editing of config files is permitted through the application.
- **FR-035**: System MUST indicate when a setting in a higher-precedence config file overrides a setting from a lower-precedence file.

### Key Entities

- **NuGet Source**: A configured package feed with a name, URL or filesystem path, and enabled/disabled status. May be a remote HTTP feed, a local directory, or the managed local source.
- **NuGet Local Cache**: A cache location managed by the dotnet CLI, identified by type (http-cache, global-packages, temp, plugins-cache), filesystem path, and current disk usage.
- **Local Source Package**: A .nupkg file residing in the managed local NuGet source, identified by package ID, version, and file size.
- **Application Configuration**: Persistent settings for the TUI application including the local source directory path and any user preferences, stored in the OS-appropriate configuration folder.
- **Package Metadata**: Detailed information extracted from a .nupkg file including package ID, version, authors, description, license, dependencies (grouped by target framework with version constraints), and supported target frameworks.
- **NuGet Config File**: A configuration file in the NuGet config hierarchy, identified by its filesystem path, precedence level, and contents (sources, package source mappings, and other settings).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view, add, edit, and delete NuGet sources entirely through the TUI without needing to use separate CLI commands.
- **SC-002**: Users can view cache locations and clear any or all caches within 3 interactions (navigate, select, confirm) from the main menu.
- **SC-003**: The managed local NuGet source is available and registered as a source on every application launch, requiring zero manual setup from the user.
- **SC-004**: Users can add a locally-built package to the local source within 5 interactions from the main menu (navigate, select add, specify project path, confirm, done).
- **SC-005**: All primary workflows (source management, cache management, local source management) are completable using only keyboard input.
- **SC-006**: Every destructive action requires explicit user confirmation before execution.
- **SC-007**: Navigation patterns (list traversal, selection, back/cancel, confirm) are consistent across all views in the application.
- **SC-008**: The application detects and clearly reports environment issues (missing dotnet CLI, permission errors, unreachable sources) rather than failing silently.
- **SC-009**: Users can search for a package and view its details within 3 interactions from the main menu (navigate to search, enter query, select result).
- **SC-010**: Users can inspect full metadata for any package in the local source or cache within 2 interactions from the package list (select package, view details).
- **SC-011**: Users can view the NuGet config file hierarchy and inspect any config file's contents within 2 interactions from the main menu.

## Assumptions

- The dotnet CLI (version 6.0 or later) is installed and available on the user's PATH.
- The user has appropriate filesystem permissions to read/write to NuGet configuration files and cache directories under normal conditions.
- NuGet configuration follows standard dotnet conventions (nuget.config hierarchy). The application reads the merged view from all levels but writes only to the user-level configuration.
- The application runs in a terminal that supports standard ANSI escape sequences for TUI rendering.
- The application MUST support Windows, macOS, and Linux as target platforms.
- OS configuration folder conventions: `~/.config/nugman` on Linux, `~/Library/Application Support/nugman` on macOS, `%APPDATA%\nugman` on Windows.
- The local source is a simple directory-based NuGet feed (folder of .nupkg files), not a hosted NuGet server.
- Build/pack operations use `dotnet pack` with default configuration (Release) unless the user specifies otherwise.

## Potential Future Features

The following features were identified as potentially valuable future additions. They are documented here for consideration but are not included in the current requirements:

- **Credential Management**: View and manage authentication credentials for private NuGet feeds (tokens, API keys) through the TUI.
- **Bulk Build/Pack**: Build and pack multiple projects at once into the local source for multi-project solutions.
- **Search-to-Install**: Allow users to install or download packages from search results directly into a project or the local source.
- **Config File Editing**: Allow direct editing of NuGet configuration files through the TUI (currently read-only).
