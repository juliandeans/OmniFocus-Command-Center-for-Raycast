# Safety and Security Contract

This extension interacts directly with the user's local OmniFocus database. This document defines the security architecture and data safety contracts enforced across the codebase.

## 1. Zero External Network Communication & Telemetry

- **Local-Only Communication**: All communication takes place strictly on the local machine via macOS Automation (JXA) and Omni Automation (`evaluateJavascript`).
- **No External APIs or Sync**: The extension makes zero HTTP requests to remote servers or third-party APIs.
- **No Telemetry or Tracking**: No analytics, telemetry, crash reports, or user usage metrics are gathered or transmitted.

## 2. The `j()` Escaping Contract

- **No Raw Script Interpolation**: User-provided inputs (task titles, notes, tag names, folder names, search terms) are **never** directly interpolated into JXA or Omni Automation scripts.
- **Safe Serialization**: All script parameters must pass through the central `j()` helper (`JSON.stringify()`), which guarantees robust escaping against code injection, template literal evaluation, quotes, backslashes, line separators, control bytes, and Unicode characters.
- **Roundtrip Testing**: Escaping integrity is formally verified by automated unit test suites.

## 3. Stable Identifiers for All Mutations

- **ID-Based Resolution**: Every mutation resolves its target object in OmniFocus using its immutable primary key (`id.primaryKey` / `byIdentifier`).
- **No Name-Based Targeting**: Titles are treated purely as display values. Because OmniFocus permits duplicate task and project names, names are never used as mutation keys or destinations.

## 4. Privacy: Reduced List Caches & Live Note Loading

- **No Notes in Disk Cache**: To protect user privacy, persistent list caches stored on disk by Raycast (`useCachedPromise`) contain only structural metadata (ID, title, status, dates, tags, folder). Full task notes are **never** serialized into list DTOs.
- **`hasNote` Indicator**: The list DTO contains a boolean `hasNote` flag indicating presence without storing the note text.
- **Live On-Demand Fetch**: Full task notes are fetched live from OmniFocus only when explicitly requested (e.g. when opening `TaskDetail` or `EditTaskForm`).
- **Cache is Acceleration, Never Source of Truth**: Cache entries only serve as display acceleration. If an item is deleted or moved externally, mutations fail cleanly with stable error codes (`task_not_found`, `project_not_found`) rather than operating on stale targets.
- **No Editing Against Reduced DTOs**: Name and note editing requires a successful live full fetch (`getTask`/`getProject`). If that fetch fails, the edit form shows an error state and offers no Save action — a failed fetch can never present an empty, saveable note field that would overwrite the real OmniFocus note with `""`.

## 5. Remote Markdown Image Blocking

- **Sanitization**: Task notes rendered in `Detail` views pass through a pure-function Markdown sanitizer (`src/lib/sanitize.ts`).
- **Image Blocking**: The sanitizer makes no attempt to fully parse markdown image grammar. HTML `<img>` tags are removed, the common image forms (inline, full/collapsed reference, shortcut with definition) are replaced with a neutral placeholder (`[Remote image blocked]`), and as a catch-all every remaining potential image start (`![`) is neutralized — covering exotic but valid alt-texts such as escaped or nested brackets. This prevents unauthorized remote network requests, IP leaks, or tracking pixels.
- **No Metadata Markdown**: Task names, project names, statuses, tags, and dates are rendered as plain text (`navigationTitle`, `Detail.Metadata`), never interpolated into markdown strings. A task title like `Meeting ![x](https://…)` cannot trigger a remote image.
- **Link Integrity**: Standard Markdown hyperlinks (`[text](https://...)`) and standard formatting (bold, italic, code blocks, lists) remain intact. Accepted trade-off: literal text or code spans containing `![` are also neutralized.

## 6. Planned-Date Capability Gating

- **Resilient Serialization**: In OmniFocus versions < 4.7 or unmigrated databases, accessing `task.plannedDate` or `project.task.plannedDate` throws an exception in the OmniFocus engine. The serializer wraps planned-date access in safe try/catch blocks so reads never fail.
- **Central Capability Detection**: The extension probes for Planned Date support centrally. Support is only reported when a sample task proves the database was migrated (an empty database yields an inconclusive result that is never treated as supported); only verified results are cached in-memory for the process lifetime. Inconclusive or transiently failed probes are never cached, so a single glitch or an empty database cannot hide Planned Dates permanently.
- **UI Gating**: Planned date pickers are conditionally rendered. When support is ruled out, an informative message shows: `"Requires OmniFocus 4.7+ with a database migrated for Planned Dates."` When the probe fails or cannot verify (empty database), the form shows "Could not check Planned Date support" with the normalized reason and a Retry action — Due and Defer dates keep working.
- **Mutation Guard**: Attempts to write planned dates on unsupported databases throw `planned_date_unsupported` rather than unhandled JXA exceptions.
- **Due and Defer Independence**: Due dates and defer dates function completely independently of planned date support.

## 7. Normalized Error Architecture

- **Stable Error Codes**: Technical and communication errors are normalized into distinct error codes (`omnifocus_not_installed`, `automation_permission_denied`, `automation_unavailable`, `planned_date_unsupported`, `task_not_found`, `project_not_found`, `tag_not_found`, `folder_not_found`, `perspective_not_found`, `invalid_input`, `timeout`, `unknown`).
- **Single Classification Gate**: Every command's data fetch runs through the gateway, whose failures are normalized before presentation. There is no separate requirement probe running alongside queries — that would only duplicate the same failing call. OmniFocus Standard (no Pro) is classified as `automation_unavailable` via the JXA "doesn't understand evaluateJavascript" error pattern; permission denial (`-1743`) is matched first and can never be misclassified as "Pro required".
- **No Script or User Data Leaks**: Raw JXA error messages, script bodies, stack traces, and user data are stripped and sanitized. The UI displays clear, actionable, user-friendly explanations.
- **Unified Views**: All commands utilize a consolidated error presentation layer (`OmniFocusEmptyView` and `runMutation`), providing direct deep links to macOS Privacy & Security settings when permissions are required.

## 8. Destructive Operation Guardrails

- **Explicit Confirmation**: Task deletions and project deletions require explicit confirmation via destructive confirmation dialogs.
- **Status Transitions**: Moving projects to **Done** or **Dropped** requires confirmation to prevent accidental removal from active workflows.
- **No Hidden Cleanup**: The extension never calls `cleanUp()` automatically, preventing unexpected changes in user perspective views.

## 9. Batch Creation Guardrails

- **Soft Limit (50)**: "Add Multiple Tasks" and "Create Project" (initial tasks) show a confirmation dialog above 50 tasks in a single action; cancelling the dialog prevents any mutation.
- **Hard Limit (200)**: Above 200 tasks the creation is rejected with a clear form error — enforced in the UI and again inside the mutation layer, so no OmniFocus write can occur.
- **Empty Lines Don't Count**: Only non-empty lines produce tasks; the limits apply to the parsed count.
