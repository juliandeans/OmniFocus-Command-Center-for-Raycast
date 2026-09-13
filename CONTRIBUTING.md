# Contributing to OmniFocus Command Center

Thank you for contributing to OmniFocus Command Center for Raycast.

This is an open-source, community-driven Raycast extension designed for local installation.

## Prerequisites

- **macOS** 13+
- **Raycast**
- **OmniFocus 4** (OmniFocus Pro required for automation features)
- **Node.js** >= 22.22.2 (as specified in `package.json` engines)
- **npm**

## Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/juliandeans/OmniFocus-Command-Center-for-Raycast.git
   cd OmniFocus-Command-Center-for-Raycast
   ```

2. Install dependencies:

   ```bash
   npm ci
   ```

3. Run local extension development mode in Raycast:

   ```bash
   npm run dev
   ```

## Development Quality Gates

Before opening a pull request, ensure all validation gates pass:

```bash
npm run validate
```

This runs:

1. `npm test` (Vitest test suite)
2. `npm run typecheck` (`tsc --noEmit`)
3. `npm run lint` (`eslint .`)
4. `npm run build` (`ray build`)

Code formatting is enforced via Prettier:

```bash
npm run format
```

## Security and Architecture Guidelines

### 1. The `j()` Escaping Contract

> [!IMPORTANT]
> **Never interpolate raw user input** (task titles, notes, tags, folder names, search queries, etc.) into JXA or Omni Automation script templates.

Always encode parameters using the central `j()` helper from `src/lib/omnifocus/gateway.ts`:

```ts
// ❌ INSECURE: Do not do this
executeOmniAutomation(`const t = Task.byIdentifier("${id}");`);

// ✅ SECURE: Always use j()
executeOmniAutomation(`const t = Task.byIdentifier(${j(id)});`);
```

### 2. ID-Based Mutations

Mutations must always resolve items by their stable OmniFocus identifier (`id` / `primaryKey`). Never mutate objects based on title or name matching, as duplicate names are allowed in OmniFocus.

### 3. Note Privacy & Reduced List DTOs

Persistent list caches managed by `useCachedPromise` must **never** store task notes. Notes are loaded live on demand (e.g. in `TaskDetail` or `EditTaskForm`). When adding new list queries or modifying serializers, ensure `note` is not serialized into cached list summaries.

### 4. Tests for New Functionality

Any new helper function, parser, serializer, or sanitizer in `src/lib/` must be accompanied by automated unit tests in `tests/`.

Unit tests must run completely in-memory against pure functions or mocked boundaries. **Unit tests must never touch real OmniFocus databases.**

### 5. Manual Testing with Disposable Data

Manual testing and verification must only be performed against a **disposable OmniFocus test database** or test items clearly prefixed with `[TEST]`.

> [!CAUTION]
> **Never include personal, private, or real-world tasks, client names, notes, or credentials in tests, fixtures, screenshots, issue descriptions, or pull requests.**

### 6. Optional Date Assignment Contract

All date parameters (`dueDate`, `deferDate`, `plannedDate`) in `createTask()`, `createProject()`, `setTaskDates()` and `setProjectDates()` follow one strict contract, enforced by `dateAssignment()` in `src/lib/omnifocus/mutations.ts`:

- `undefined` → the property is **not touched at all** (no assignment code is generated — required on OmniFocus databases without Planned Date support);
- `null` → the property is **explicitly cleared** (`= null`);
- `Date` → the property is set to that date.

Never default an unset optional date to `null`. Planned dates additionally require a positive capability probe (`getPlannedDateCapability()`); the probe must stay conservative — support is only confirmed against a real sample task, and inconclusive probes (e.g. an empty database) are never cached and never treated as supported.

### 7. Batch Write Limits

Any feature that creates multiple items in one action must go through `evaluateBatchSize()` from `src/lib/batch.ts`: up to 50 silently, 51–200 with a confirmation dialog, above 200 rejected — and the mutation layer enforces the hard limit again before any Omni Automation call.

## Further Technical Documentation

For deeper details on design principles, security contracts, and acceptance checklists:

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Safety and Security Contract](docs/SAFETY.md)
- [Testing and Acceptance Checklist](docs/TESTING.md)
- [Security Policy](SECURITY.md)
