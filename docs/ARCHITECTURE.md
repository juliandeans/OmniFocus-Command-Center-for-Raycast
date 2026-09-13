# Architecture

## Goal

The extension provides a unified OmniFocus command center for Raycast. Commands own navigation and entry points; shared components own task and project management behavior; a centralized gateway owns application communication.

## Layers

### 1. Raycast Command Layer (`src/*.tsx`, `src/*.ts`)

Command entry points are lightweight orchestrators that select a query and render a shared view or form:

- `search-projects.tsx` → active projects + `ProjectActions` (Open Project regression contract)
- `search-tasks.tsx` → global open tasks + `TaskListView`
- `inbox.tsx` → Inbox tasks + `TaskListView`
- `show-tasks.tsx` → `ProjectPicker` → `ProjectTasksView`
- `open-omnifocus.tsx` → built-in areas & custom perspectives
- `browse-by-tag.tsx` → tag selector + tag task list
- `review-projects.tsx` → review-due projects list
- `add-task.tsx`, `add-multiple-tasks.tsx`, `quick-add-to-inbox.ts`, `create-project.tsx` → capture forms

### 2. Shared UI & Mutation Layer (`src/components/`, `src/lib/ui.ts`)

- `TaskListView` — canonical task rendering, status toggles, editing, date forms, and action panel.
- `ProjectActions` — canonical project action panel, status transitions, date forms, and editing.
- `ProjectPicker` — active project fuzzy picker.
- `runMutation()` — single canonical helper for writing actions with animated loading toasts, success notifications, normalized error handling, and revalidation callbacks.
- `OmniFocusEmptyView` — centralized empty/error state component providing actionable guidance (such as deep links to macOS Automation settings).

### 3. OmniFocus Gateway (`src/lib/omnifocus/gateway.ts`)

Centralized low-level bridge with two execution paths:

1. `executeJxa()` — executes macOS JavaScript for Automation via `@raycast/utils`'s `runAppleScript`.
2. `executeOmniAutomation()` — JXA asks OmniFocus to execute code inside its Omni Automation context via `evaluateJavascript`.

All user parameters are encoded using `j()` (`JSON.stringify`) to eliminate injection risks. Technical error details are sanitized and normalized via `normalizeOmniFocusError()`.

### 4. Query & Serializer Layer (`src/lib/omnifocus/queries.ts`, `src/lib/omnifocus/serialize.ts`)

- `listActiveProjects()` maintains the proven Project Jump JXA implementation to ensure zero regressions.
- List queries serialize tasks and projects into reduced DTOs that **omit task notes**, keeping notes out of Raycast's persistent disk cache.
- `getTask()` and `getProject()` load full items live on demand including their note.
- `serialize.ts` wraps `plannedDate` property accesses in safe try/catch blocks, ensuring queries remain resilient on OmniFocus < 4.7 or unmigrated databases.

### 5. Mutation Layer (`src/lib/omnifocus/mutations.ts`)

All writes are defined in `mutations.ts`. UI components never embed raw automation scripts. Mutations strictly target stable identifiers (`id.primaryKey`) rather than titles.

### 6. Sanitization Layer (`src/lib/sanitize.ts`)

- `sanitizeMarkdown()` makes rendering a remote image from note content impossible: HTML `<img>` tags are removed, common image forms (inline, full/collapsed reference, shortcut with definition) are replaced with a placeholder (`[Remote image blocked]`), and every remaining potential markdown image start `![` is neutralized as a catch-all (covers escaped/nested-bracket alt-texts without parsing markdown). Standard hyperlinks and markdown syntax are preserved.
- Task titles and metadata are never rendered as markdown: `TaskDetail` uses `navigationTitle` (plain text) and `Detail.Metadata` (plain text) for project, status, tags, and dates. Only the sanitized note itself goes into the markdown content area.

### 7. Capability Detection (`src/lib/omnifocus/capabilities.ts`) & Error Presentation (`src/lib/omnifocus/requirements.tsx`)

- `getPlannedDateCapability()` probes database support for Planned Dates. Only verified results are cached for the process lifetime: supported requires an exposed `plannedDate` property plus a sample task proving the database was migrated. An empty database yields an inconclusive probe that is never treated as supported and never cached; transient failures (permission denied, timeout, communication errors) are likewise never cached, so the next call retries instead of the outcome sticking until the process ends.
- Error classification runs through a single gate: every query/mutation failure is normalized (`src/lib/omnifocus/errors.ts`) and presented via `OmniFocusEmptyView`, distinguishing "not installed", "permission denied", "Omni Automation / Pro unavailable", and timeouts. No separate requirement probe runs alongside queries — a probe would only duplicate the same failing call. OmniFocus Standard (no Pro) is classified via the JXA "doesn't understand evaluateJavascript" error pattern.
