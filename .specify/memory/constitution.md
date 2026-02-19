<!--
Sync Impact Report
===================
- Version change: N/A → 1.0.0 (initial ratification)
- Modified principles: N/A (initial creation)
- Added sections:
  - Core Principles (5 principles)
  - Technology Standards
  - Development Workflow
  - Governance
- Removed sections: N/A
- Templates requiring updates:
  - .specify/templates/plan-template.md — ✅ reviewed, compatible
  - .specify/templates/spec-template.md — ✅ reviewed, compatible
  - .specify/templates/tasks-template.md — ✅ reviewed, compatible
- Follow-up TODOs: None
-->

# Nugman Constitution

## Core Principles

### I. Component-First Architecture

All features MUST be built as self-contained, reusable components.
Components MUST:

- Have a single, well-defined responsibility
- Declare explicit props/inputs with TypeScript interfaces
- Be independently importable without pulling unrelated dependencies
- Include co-located types, utilities, and styles where applicable
- Expose a clean public API; hide internal implementation details

Shared components MUST live in a dedicated shared/common directory.
Feature-specific components MUST live within their feature boundary.
Duplication across two locations is acceptable; duplication across
three or more MUST be extracted into a shared component.

### II. Strict TypeScript & Modern Practices

TypeScript strict mode (`strict: true`) MUST be enabled project-wide
with no escape hatches in tsconfig. The type system is a first-class
quality gate.

Rules:

- `any` is forbidden; use `unknown` with type narrowing instead
- Prefer discriminated unions over loose string enums for state
- Use `readonly` for data that MUST NOT be mutated
- Prefer `interface` for object shapes; use `type` for unions and
  computed types
- Generic types MUST have descriptive names (not single letters
  outside trivial utility types)
- Barrel exports (`index.ts`) MUST only re-export public API;
  no side effects
- Use `satisfies` for type-safe object literals where inference
  alone is insufficient
- Prefer `const` assertions and template literal types where they
  reduce boilerplate
- Nullability MUST be handled explicitly; no non-null assertions
  (`!`) except in test files with justification

### III. Test-Driven Quality

Every feature MUST include tests appropriate to its scope. Testing
is a prerequisite for merge, not an afterthought.

Requirements:

- Unit tests MUST cover all public functions, components, and
  utilities
- Integration tests MUST cover user-facing workflows that span
  multiple components or services
- Component tests MUST verify rendering, props, user interactions,
  and accessibility
- Test files MUST be co-located with source or in a mirrored
  `__tests__` directory
- Tests MUST NOT depend on implementation details; test behavior
  and outputs
- Coverage thresholds: aim for meaningful coverage, not percentage
  targets; every branch of business logic MUST be tested
- Mocks MUST be minimal and scoped; prefer real implementations
  or lightweight fakes over deep mocking

Test naming convention: `describe("[Unit]", () => { it("SHOULD
[behavior] WHEN [condition]") })`.

### IV. Consistent User Experience

The user interface MUST present a unified, predictable experience
across all features. Consistency reduces cognitive load and builds
user trust.

Rules:

- A shared design token system (colors, spacing, typography, radii)
  MUST be defined and consumed by all UI components
- Interactive patterns (buttons, forms, modals, navigation) MUST
  follow a single interaction model across the application
- Loading, error, and empty states MUST be handled uniformly using
  shared state components
- Accessibility MUST meet WCAG 2.1 AA: semantic HTML, keyboard
  navigation, ARIA attributes, sufficient color contrast
- Responsive layouts MUST use a consistent breakpoint scale
- Animation and transition timing MUST use shared duration/easing
  tokens
- All user-facing text MUST be externalizable (no hardcoded strings
  in component logic)

**TUI-Specific Adaptations**: For terminal UI applications built with
frameworks like Ink, the following adaptations apply:

- Keyboard accessibility fully satisfies the navigation requirement;
  WCAG 2.1 AA semantic HTML and ARIA attributes do not apply to TUI
- Terminal width/height detection replaces responsive breakpoint
  scales; define a minimum terminal size and handle gracefully
- TUI applications are exempt from animation/transition timing tokens
  as terminal rendering does not support CSS-style animations
- Color contrast MUST be maintained using ANSI color pairs that are
  legible across common light and dark terminal themes
- Design tokens for TUI: define named constants for ANSI colors,
  spacing (character/line counts), and text styles (bold, dim, etc.)

### V. Clean Code & Maintainability

Code MUST be written for the next reader, not just the current
author. Clarity and simplicity take priority over cleverness.

Rules:

- Functions MUST do one thing; if a function needs a conjunction
  ("and") to describe its purpose, split it
- Files MUST NOT exceed ~300 lines; extract when approaching this
  limit
- Naming MUST be descriptive and unambiguous: `getUserPermissions`
  over `getPerms`, `isAuthenticated` over `auth`
- Magic numbers and strings MUST be extracted into named constants
- Side effects MUST be isolated at the boundary (API calls, storage,
  DOM manipulation); keep core logic pure
- Dependencies MUST be minimized; prefer standard library and
  platform APIs over third-party packages for trivial operations
- Dead code MUST be deleted, not commented out; version control
  preserves history
- Import order MUST be consistent: external deps, then internal
  absolute paths, then relative paths

## Technology Standards

The following technology choices and configurations are mandatory
for all project code:

- **Language**: TypeScript (strict mode, latest stable)
- **Linting**: ESLint with a strict, shared config; zero warnings
  policy in CI
- **Formatting**: Prettier with project-wide config; enforced via
  pre-commit hook or CI
- **Package manager**: Must be consistent across the project;
  lockfile MUST be committed
- **Module system**: ESM (`"type": "module"`) preferred; CommonJS
  only when required by tooling
- **Path aliases**: MUST be configured in both tsconfig and bundler;
  no deep relative imports (`../../../`)
- **Dependency policy**: New dependencies MUST be justified;
  prefer well-maintained packages with TypeScript support

## Development Workflow

All code changes MUST follow this workflow:

1. **Branch**: Create a feature branch from `main` with a
   descriptive name
2. **Implement**: Write code following constitution principles;
   include tests
3. **Self-review**: Run linter, formatter, and full test suite
   locally before pushing
4. **Pull request**: PR description MUST summarize changes,
   link related issues, and note any constitution principle
   trade-offs
5. **Code review**: At least one approval required; reviewer
   MUST verify constitution compliance
6. **Merge**: Squash merge to `main`; commit message follows
   conventional commits (`feat:`, `fix:`, `refactor:`, etc.)

Quality gates that MUST pass before merge:

- All tests pass
- No linter errors or warnings
- No TypeScript compiler errors
- No `any` types introduced without explicit justification
- New components include tests and follow design system tokens

## Governance

This constitution is the authoritative source for project standards.
All code, reviews, and architectural decisions MUST comply with
these principles.

Amendment procedure:

1. Propose changes via pull request to this file
2. Include rationale for each change and impact assessment
3. All active contributors MUST review and approve
4. Update version number per semantic versioning rules below
5. Update `LAST_AMENDED_DATE` to the amendment date

Versioning policy:

- **MAJOR**: Principle removed, redefined, or made backward
  incompatible
- **MINOR**: New principle added or existing principle materially
  expanded
- **PATCH**: Clarifications, wording improvements, non-semantic
  refinements

Compliance review: Constitution principles MUST be referenced
in code review checklists. Violations MUST be resolved before
merge or explicitly documented with justification.

**Version**: 1.0.0 | **Ratified**: 2026-02-18 | **Last Amended**: 2026-02-18
