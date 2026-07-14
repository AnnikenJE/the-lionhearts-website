# Refactor All: Full Codebase Review and Cleanup

Review all source files in the project for reuse, quality, and efficiency. Fix all issues found.

## Phase 1: Discover Source Files

Read all files under `app/`, `server/`, `public/`, and root config files (`nuxt.config.ts`, `eslint.config.mjs`). Skip `node_modules/`, `.nuxt/`, `.output/`, and lock files.

## Phase 2: Launch Three Review Agents in Parallel

Use the Agent tool to launch all three agents concurrently in a single message. Pass each agent the full file contents so it has complete context.

### Agent 1: Code Reuse Review

For each file:

1. **Search for existing utilities and helpers** that could replace code. Look for similar patterns across files — common locations are composables, utils, shared modules.
2. **Flag any function that duplicates existing functionality.** Suggest the existing function to use instead.
3. **Flag any inline logic that could use an existing utility** — hand-rolled string manipulation, manual path handling, custom environment checks, ad-hoc type guards.

### Agent 2: Code Quality Review

Review all files for hacky patterns:

1. **Redundant state**: state duplicating existing state, cached values that could be derived
2. **Parameter sprawl**: adding parameters instead of generalizing existing functions
3. **Copy-paste with slight variation**: near-duplicate blocks that should share an abstraction
4. **Leaky abstractions**: exposing internals that should be encapsulated
5. **Stringly-typed code**: raw strings where constants, enums, or string unions should exist
6. **Unnecessary JSX/Vue template nesting**: wrapper elements that add no layout value
7. **Nested conditionals**: ternary chains or nested if/else 3+ levels deep — flatten with early returns, guard clauses, or lookup tables
8. **Unnecessary comments**: comments explaining WHAT the code does — delete; keep only non-obvious WHY

### Agent 3: Efficiency Review

Review all files for efficiency:

1. **Unnecessary work**: redundant computations, repeated reads, duplicate API calls, N+1 patterns
2. **Missed concurrency**: independent operations run sequentially that could be parallel
3. **Hot-path bloat**: blocking work added to startup or per-request/per-render paths
4. **Memory**: unbounded data structures, missing cleanup, event listener leaks
5. **Overly broad operations**: reading entire resources when only a portion is needed

## Phase 3: Fix Issues

Wait for all three agents to complete. Aggregate findings and fix each issue directly in the source files. If a finding is a false positive or not worth addressing, note it and skip — do not argue.

When done, summarize what was fixed (or confirm the code was already clean).
